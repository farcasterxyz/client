// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  type ApiEngagementRingCandidate,
  type ApiErrorResponse,
  HandledFetchError,
} from 'farcaster-client-data';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line no-restricted-imports
import { AdminEngagementRingCandidatesContent } from '~/pages/adminEngagementRingCandidates/AdminEngagementRingCandidatesPage';

const mockSetSearchParams = vi.fn();
const mockUseEngagementRingCandidates = vi.fn();
const mockUseNonSuspenseUserByFid = vi.fn();
const mockSetNeynarScoreOverride = vi.fn();

let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );

  return {
    ...actual,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams] as const,
  };
});

vi.mock('farcaster-client-hooks', async () => {
  const actual = await vi.importActual<typeof import('farcaster-client-hooks')>(
    'farcaster-client-hooks',
  );

  return {
    ...actual,
    useEngagementRingCandidates: (...args: unknown[]) =>
      mockUseEngagementRingCandidates(...args),
    useNonSuspenseUserByFid: (...args: unknown[]) =>
      mockUseNonSuspenseUserByFid(...args),
  };
});

vi.mock('~/components/page/Page', () => ({
  Page: ({
    children,
  }: {
    children: React.ReactNode;
    meta: { title: string };
  }) => <div>{children}</div>,
}));

vi.mock('~/components/forms/TextInput', () => ({
  TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock('~/components/forms/CheckBoxInput', () => ({
  CheckboxInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input type="checkbox" {...props} />
  ),
}));

vi.mock('~/components/forms/buttons/DefaultButton', () => ({
  DefaultButton: ({
    children,
    isLoading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    isLoading?: boolean;
  }) => <button {...props}>{isLoading ? 'loading' : children}</button>,
}));

vi.mock('~/components/lists/DefaultEmptyListView', () => ({
  DefaultEmptyListView: ({ message }: { message: string }) => (
    <div>{message}</div>
  ),
}));

vi.mock('~/components/loaders/LoadingIndicator', () => ({
  LoadingIndicator: ({ size }: { size?: string }) => (
    <div aria-label="loading">{size ?? 'md'}</div>
  ),
}));

vi.mock('~/components/users/User', () => ({
  User: ({ user }: { user: { displayName: string; username: string } }) => (
    <div>
      <div>{user.displayName}</div>
      <div>@{user.username}</div>
    </div>
  ),
}));

vi.mock('~/hooks/data/useSetNeynarScoreOverride', () => ({
  useSetNeynarScoreOverride: () => mockSetNeynarScoreOverride,
}));

function makeUser(
  fid: number,
  displayName: string,
  username = displayName,
  options?: {
    followerCount?: number;
    followingCount?: number;
    neynarScore?: number;
  },
) {
  return {
    fid,
    displayName,
    username,
    followerCount: options?.followerCount ?? 10,
    followingCount: options?.followingCount ?? 5,
    ...(typeof options?.neynarScore === 'number'
      ? { neynarScore: options.neynarScore }
      : {}),
    profile: {
      bio: {
        text: `${displayName} bio`,
        mentions: [],
        channelMentions: [],
      },
    },
  };
}

function makeUserProfile(
  fid: number,
  displayName: string,
  username = displayName,
  options?: {
    followerCount?: number;
    neynarScore?: number;
    neynarScoreInfo?: {
      effectiveScore?: number;
      originalScore?: number;
      overridden: boolean;
      overrideScore?: number;
      overriddenByFid?: number;
      overrideReason?: string;
    };
  },
) {
  return {
    user: makeUser(fid, displayName, username, {
      followerCount: options?.followerCount,
      neynarScore: options?.neynarScore,
    }),
    collectionsOwned: [],
    extras: {
      fid,
      custodyAddress: '0x0000000000000000000000000000000000000000',
    },
    ...(options?.neynarScoreInfo
      ? { neynarScoreInfo: options.neynarScoreInfo }
      : {}),
  };
}

function makeCandidate(
  fid: number,
  displayName: string,
  username = displayName,
  options?: {
    followerCount?: number;
    neynarScore?: number;
    neynarScoreInfo?: {
      effectiveScore?: number;
      originalScore?: number;
      overridden: boolean;
      overrideScore?: number;
      overriddenByFid?: number;
      overrideReason?: string;
    };
    likesFromSubject?: number;
    likesToSubject?: number;
    ringPairScore?: number;
    totalLikesGiven?: number;
    totalLikesReceived?: number;
    likesPerLiker?: number;
    top10LikerShare?: number;
  },
): ApiEngagementRingCandidate {
  return {
    user: makeUserProfile(fid, displayName, username, {
      followerCount: options?.followerCount,
      neynarScore: options?.neynarScore,
      neynarScoreInfo: options?.neynarScoreInfo,
    }),
    likesFromSubject: options?.likesFromSubject ?? 4,
    likesToSubject: options?.likesToSubject ?? 3,
    ringPairScore: options?.ringPairScore ?? 2.4,
    totalLikesGiven: options?.totalLikesGiven ?? 40,
    totalLikesReceived: options?.totalLikesReceived ?? 30,
    likesPerLiker: options?.likesPerLiker ?? 1.88,
    top10LikerShare: options?.top10LikerShare ?? 0.42,
  };
}

function makeHandledFetchError(status: number) {
  return new HandledFetchError('Request failed', {
    absoluteUrl: 'https://farcaster.xyz/v1/engagement-ring-candidates',
    body: undefined,
    endpointName: 'getEngagementRingCandidates',
    hasTimedOut: false,
    isHandled: true,
    isNetworkError: false,
    isOffline: false,
    method: 'GET',
    relativeUrl: '/v1/engagement-ring-candidates',
    resolvedTimeout: 1000,
    response: undefined,
    responseData: {
      errors: [{ message: 'Not authorized', reason: 'not_authorized' }],
    } as unknown as ApiErrorResponse,
    status,
    timeout: 1000,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminEngagementRingCandidatesContent />
    </MemoryRouter>,
  );
}

function getCandidateOrder() {
  return screen
    .getAllByTestId(/candidate-card-/)
    .map((node) => node.getAttribute('data-testid'));
}

describe('AdminEngagementRingCandidatesContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    mockUseEngagementRingCandidates.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockSetNeynarScoreOverride.mockResolvedValue({
      result: { success: true },
    });
  });

  it('shows the form-only state when no fid is present', () => {
    renderPage();

    expect(screen.getByPlaceholderText('Enter an FID')).toBeTruthy();
    expect(
      screen.getByText(
        'Enter a seed FID to investigate engagement ring candidates.',
      ),
    ).toBeTruthy();
  });

  it('submits a valid fid into the URL search params', () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Enter an FID'), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find candidates' }));

    expect(mockSetSearchParams).toHaveBeenCalledWith({ fid: '123' });
  });

  it('shows an inline validation error for an invalid fid', () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Enter an FID'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find candidates' }));

    expect(screen.getByText('Enter a valid numeric FID.')).toBeTruthy();
    expect(mockSetSearchParams).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while the candidates request is pending', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: true,
      isFetching: true,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('seed-card')).toBeTruthy();
    expect(screen.getByLabelText('loading')).toBeTruthy();
  });

  it('renders the seed account first and candidate rows in API order by default', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha', {
              ringPairScore: 2.4,
              totalLikesReceived: 30,
            }),
            makeCandidate(789, 'Beta', 'beta', {
              ringPairScore: 2,
              totalLikesReceived: 22,
            }),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('seed-card')).toBeTruthy();
    expect(getCandidateOrder()).toEqual([
      'candidate-card-456',
      'candidate-card-789',
    ]);
    expect(screen.getByText('2.4')).toBeTruthy();
    expect(screen.getByText('22')).toBeTruthy();
  });

  it('sorts the candidate table by numeric columns and can return to API order', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha', {
              neynarScore: 0.8,
              likesPerLiker: 1.2,
            }),
            makeCandidate(789, 'Beta', 'beta', {
              neynarScore: 0.9,
              likesPerLiker: 3.5,
            }),
            makeCandidate(999, 'Gamma', 'gamma', {
              neynarScore: 0.7,
              likesPerLiker: 2.1,
            }),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    const likesPerLikerHeader = screen.getByRole('button', {
      name: /Likes per liker/,
    });

    expect(getCandidateOrder()).toEqual([
      'candidate-card-456',
      'candidate-card-789',
      'candidate-card-999',
    ]);

    fireEvent.click(likesPerLikerHeader);
    expect(getCandidateOrder()).toEqual([
      'candidate-card-789',
      'candidate-card-999',
      'candidate-card-456',
    ]);

    fireEvent.click(likesPerLikerHeader);
    expect(getCandidateOrder()).toEqual([
      'candidate-card-456',
      'candidate-card-999',
      'candidate-card-789',
    ]);

    fireEvent.click(likesPerLikerHeader);
    expect(getCandidateOrder()).toEqual([
      'candidate-card-456',
      'candidate-card-789',
      'candidate-card-999',
    ]);
  });

  it('shows the selected count and overrides all checked users to 0.3', async () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: {
        result: makeUserProfile(123, 'Seed', 'seed', { neynarScore: 0.8 }),
      },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha'),
            makeCandidate(789, 'Beta', 'beta', {
              ringPairScore: 2,
              totalLikesReceived: 22,
            }),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('0 selected')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Select seed user'));
    expect(screen.getByText('1 selected')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Select all candidates'));
    expect(screen.getByText('3 selected')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Override selected to 0.3' }),
    );

    await waitFor(() => {
      expect(mockSetNeynarScoreOverride).toHaveBeenCalledTimes(3);
    });
    expect(window.confirm).toHaveBeenCalled();
    expect(mockSetNeynarScoreOverride).toHaveBeenNthCalledWith(1, {
      fid: 123,
      username: 'seed',
      score: 0.3,
      reason: 'engagement ring',
    });
    expect(mockSetNeynarScoreOverride).toHaveBeenNthCalledWith(2, {
      fid: 456,
      username: 'alpha',
      score: 0.3,
      reason: 'engagement ring',
    });
    expect(mockSetNeynarScoreOverride).toHaveBeenNthCalledWith(3, {
      fid: 789,
      username: 'beta',
      score: 0.3,
      reason: 'engagement ring',
    });
  });

  it('reports partial override failures and keeps failed users selected', async () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: {
        result: makeUserProfile(123, 'Seed', 'seed', { neynarScore: 0.8 }),
      },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha'),
            makeCandidate(789, 'Beta', 'beta'),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockSetNeynarScoreOverride
      .mockResolvedValueOnce({ result: { success: true } })
      .mockResolvedValueOnce({ result: { success: true } })
      .mockRejectedValueOnce(new Error('override failed'));

    renderPage();

    fireEvent.click(screen.getByLabelText('Select seed user'));
    fireEvent.click(screen.getByLabelText('Select all candidates'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Override selected to 0.3' }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Overrode 2 users to 0.3. 1 failed.'),
      ).toBeTruthy();
    });
    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('clears selections and refetches when resubmitting the same fid', async () => {
    mockSearchParams = new URLSearchParams('fid=123');
    const candidateRefetch = vi.fn();
    const seedUserRefetch = vi.fn();

    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: {
        result: makeUserProfile(123, 'Seed', 'seed', { neynarScore: 0.8 }),
      },
      error: undefined,
      isPending: false,
      refetch: seedUserRefetch,
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha'),
            makeCandidate(789, 'Beta', 'beta'),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: candidateRefetch,
    });

    renderPage();

    fireEvent.click(screen.getByLabelText('Select seed user'));
    fireEvent.click(screen.getByLabelText('Select all candidates'));
    expect(screen.getByText('3 selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Find candidates' }));

    await waitFor(() => {
      expect(candidateRefetch).toHaveBeenCalledTimes(1);
      expect(seedUserRefetch).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('0 selected')).toBeTruthy();
    expect(mockSetSearchParams).not.toHaveBeenCalled();
  });

  it('disables the seed user checkbox when the seed score is already below 0.4', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: {
        result: makeUserProfile(123, 'Seed', 'seed', { neynarScore: 0.2 }),
      },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: { result: { candidates: [] } },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(
      (screen.getByLabelText('Select seed user') as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.getByText('0.2')).toBeTruthy();
  });

  it('moves low-score users into a collapsed hidden section without checkboxes', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha', { neynarScore: 0.7 }),
            makeCandidate(789, 'Beta', 'beta', { neynarScore: 0.2 }),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Candidates (1)')).toBeTruthy();
    expect(screen.getByText('Hidden users with low scores (1)')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Hidden users with low scores \(1\)/,
      }),
    );

    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.queryByLabelText('Select Beta')).toBeNull();
  });

  it('does not show an empty state when only low-score candidates are returned', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(789, 'Beta', 'beta', { neynarScore: 0.2 }),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(
      screen.getByText(
        'All returned candidates are hidden below the Neynar score threshold.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('No candidates found')).toBeNull();
    expect(screen.getByText('Hidden users with low scores (1)')).toBeTruthy();
  });

  it('removes hidden low-score users from selection after a refetch', async () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    const listeners = new Set<() => void>();
    const createCandidatesResult = (
      candidates: ApiEngagementRingCandidate[],
    ) => ({
      data: {
        result: {
          candidates,
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    let currentCandidatesResult = createCandidatesResult([
      makeCandidate(456, 'Alpha', 'alpha', { neynarScore: 0.7 }),
      makeCandidate(789, 'Beta', 'beta', { neynarScore: 0.8 }),
    ]);

    mockUseEngagementRingCandidates.mockImplementation(() =>
      React.useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        () => currentCandidatesResult,
      ),
    );

    renderPage();

    fireEvent.click(screen.getByLabelText('Select all candidates'));
    expect(screen.getByText('2 selected')).toBeTruthy();

    currentCandidatesResult = createCandidatesResult([
      makeCandidate(456, 'Alpha', 'alpha', { neynarScore: 0.7 }),
      makeCandidate(789, 'Beta', 'beta', { neynarScore: 0.2 }),
    ]);
    React.act(() => {
      listeners.forEach((listener) => {
        listener();
      });
    });

    await waitFor(() => {
      expect(screen.getByText('1 selected')).toBeTruthy();
    });
  });

  it('uses the richer neynar score fields when present', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: {
        result: makeUserProfile(123, 'Seed', 'seed', {
          neynarScoreInfo: {
            effectiveScore: 0.73,
            overridden: false,
          },
        }),
      },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: {
        result: {
          candidates: [
            makeCandidate(456, 'Alpha', 'alpha', {
              neynarScoreInfo: {
                effectiveScore: 0.55,
                overridden: true,
              },
            }),
          ],
        },
      },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('0.73')).toBeTruthy();
    expect(screen.getByText('0.55')).toBeTruthy();
  });

  it('renders the empty state after the seed card when there are no candidates', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: { result: { candidates: [] } },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('seed-card')).toBeTruthy();
    expect(screen.getByText('Candidates (0)')).toBeTruthy();
    expect(screen.getByText('No candidates found')).toBeTruthy();
  });

  it('does not show the page error state when candidates succeed but the seed user lookup fails', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: undefined,
      error: new Error('seed lookup failed'),
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: { result: { candidates: [] } },
      error: undefined,
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.getByText('Seed account unavailable.')).toBeTruthy();
    expect(screen.getByText('Candidates (0)')).toBeTruthy();
    expect(screen.getByText('No candidates found')).toBeTruthy();
  });

  it('prefers successful candidate data over a stale query error', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: { result: { candidates: [] } },
      error: new Error('stale query error'),
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.getByText('Candidates (0)')).toBeTruthy();
    expect(screen.getByText('No candidates found')).toBeTruthy();
  });

  it('does not show the error state while candidates are refetching', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseNonSuspenseUserByFid.mockReturnValue({
      data: { result: makeUserProfile(123, 'Seed', 'seed') },
      error: undefined,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseEngagementRingCandidates.mockReturnValue({
      data: undefined,
      error: new Error('previous failure'),
      isPending: true,
      isFetching: true,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('seed-card')).toBeTruthy();
    expect(screen.getByLabelText('loading')).toBeTruthy();
    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('renders the explicit unauthorized message on 403', () => {
    mockSearchParams = new URLSearchParams('fid=123');
    mockUseEngagementRingCandidates.mockReturnValue({
      data: undefined,
      error: makeHandledFetchError(403),
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(
      screen.getByText(
        'Not authorized. This tool is only available to internal team users.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/selected$/)).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Override selected to 0.3' }),
    ).toBeNull();
  });
});
