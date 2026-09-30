import {
  ApiEngagementRingCandidate,
  ApiUser,
  ApiUserProfile,
  FarcasterApiClient,
  FarcasterApiClientMetaOptions,
  isHandledFetchError,
  OnError,
  OnFetchStart,
} from 'farcaster-client-data';
import {
  FarcasterApiClientProvider,
  useEngagementRingCandidates,
  useNonSuspenseUserByFid,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from 'react-router-dom';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { CheckboxInput } from '~/components/forms/CheckBoxInput';
import { TextInput } from '~/components/forms/TextInput';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import {
  formatNeynarScore,
  getDisplayedNeynarScore,
} from '~/components/profiles/neynarScoreUtils';
import { User } from '~/components/users/User';
import { baseApiUrl, wsUrl } from '~/constants/api';
import { AuthProvider } from '~/contexts/AuthProvider';
import { useSetNeynarScoreOverride } from '~/hooks/data/useSetNeynarScoreOverride';
import { getErrorDescription } from '~/utils/errorUtils';

const apiClient = new FarcasterApiClient();

const scoreFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});
const percentageFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 2,
});

const countFormatter = new Intl.NumberFormat();
const LOW_NEYNAR_SCORE_THRESHOLD = 0.4;

type CandidateSortKey =
  | 'ringPairScore'
  | 'likesPerLiker'
  | 'top10LikerShare'
  | 'neynarScore'
  | 'followers'
  | 'totalLikesReceived';

type CandidateSortDirection = 'asc' | 'desc';

type CandidateSortState =
  | {
      key: CandidateSortKey;
      direction: CandidateSortDirection;
    }
  | undefined;

const buildSeedHref = (fid: number) =>
  `/~/admin/engagement-ring-candidates?fid=${fid}`;
const getCandidateUser = (candidate: ApiEngagementRingCandidate) =>
  candidate.user.user;
const getCandidateDisplayedNeynarScore = (
  candidate: ApiEngagementRingCandidate,
) => getDisplayedNeynarScore(candidate.user as ApiUserProfile);
const getCandidateSortValue = (
  candidate: ApiEngagementRingCandidate,
  sortKey: CandidateSortKey,
) => {
  switch (sortKey) {
    case 'ringPairScore':
      return candidate.ringPairScore;
    case 'likesPerLiker':
      return candidate.likesPerLiker;
    case 'top10LikerShare':
      return candidate.top10LikerShare;
    case 'neynarScore':
      return getCandidateDisplayedNeynarScore(candidate);
    case 'followers':
      return getCandidateUser(candidate).followerCount;
    case 'totalLikesReceived':
      return candidate.totalLikesReceived;
  }
};

const getNextCandidateSortState = (
  currentSortState: CandidateSortState,
  sortKey: CandidateSortKey,
): CandidateSortState => {
  if (currentSortState?.key !== sortKey) {
    return { key: sortKey, direction: 'desc' };
  }

  if (currentSortState.direction === 'desc') {
    return { key: sortKey, direction: 'asc' };
  }

  return undefined;
};

const sortCandidates = (
  candidates: ApiEngagementRingCandidate[],
  sortState: CandidateSortState,
) => {
  if (typeof sortState === 'undefined') {
    return candidates;
  }

  return [...candidates]
    .map((candidate, index) => ({ candidate, index }))
    .sort((left, right) => {
      const leftValue = getCandidateSortValue(left.candidate, sortState.key);
      const rightValue = getCandidateSortValue(right.candidate, sortState.key);

      if (typeof leftValue !== 'number' && typeof rightValue !== 'number') {
        return left.index - right.index;
      }

      if (typeof leftValue !== 'number') {
        return 1;
      }

      if (typeof rightValue !== 'number') {
        return -1;
      }

      const delta =
        sortState.direction === 'desc'
          ? rightValue - leftValue
          : leftValue - rightValue;

      if (delta !== 0) {
        return delta;
      }

      return left.index - right.index;
    })
    .map(({ candidate }) => candidate);
};

const parseAdminEngagementRingFid = (
  value: string | null | undefined,
): number | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const AdminEngagementRingCandidatesPage: FC = memo(() => {
  const meta = useMemo((): FarcasterApiClientMetaOptions => ({}), []);

  const onFetchStart: OnFetchStart = useCallback(() => {}, []);

  const onError: OnError = useCallback(() => {}, []);

  return (
    <FarcasterApiClientProvider
      apiClient={apiClient}
      address={undefined}
      baseUrl={baseApiUrl}
      wsUrl={wsUrl}
      debug={false}
      meta={meta}
      onError={onError}
      onFetchStart={onFetchStart}
      readTimeout={120000}
    >
      <AuthProvider>
        <AdminEngagementRingCandidatesContent />
      </AuthProvider>
    </FarcasterApiClientProvider>
  );
});

const AdminEngagementRingCandidatesContent: FC = memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFid = searchParams.get('fid');
  const submittedFid = parseAdminEngagementRingFid(rawFid);
  const hasSubmittedSearch = rawFid !== null;
  const hasInvalidSearchFid =
    hasSubmittedSearch && typeof submittedFid === 'undefined';

  const [inputValue, setInputValue] = useState(rawFid ?? '');
  const [selectedCandidateFids, setSelectedCandidateFids] = useState<number[]>(
    [],
  );
  const [isSeedUserSelected, setIsSeedUserSelected] = useState(false);
  const [isHiddenLowScoreExpanded, setIsHiddenLowScoreExpanded] =
    useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<
    { kind: 'success' | 'error'; message: string } | undefined
  >(undefined);
  const [isOverridingScores, setIsOverridingScores] = useState(false);
  const [candidateSortState, setCandidateSortState] =
    useState<CandidateSortState>(undefined);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    setInputValue(rawFid ?? '');
  }, [rawFid]);

  useEffect(() => {
    if (rawFid === null) {
      setValidationError(undefined);
      return;
    }

    if (hasInvalidSearchFid) {
      setValidationError('Enter a valid numeric FID.');
      return;
    }

    setValidationError(undefined);
  }, [hasInvalidSearchFid, rawFid]);

  const candidateQuery = useEngagementRingCandidates({
    fid: submittedFid,
    enabled: typeof submittedFid !== 'undefined',
  });
  const setNeynarScoreOverride = useSetNeynarScoreOverride();

  const seedUserQuery = useNonSuspenseUserByFid({
    fid: submittedFid ?? 0,
    enabled: typeof submittedFid !== 'undefined',
  });

  const candidates = useMemo(
    () => candidateQuery.data?.result.candidates ?? [],
    [candidateQuery.data?.result.candidates],
  );
  const visibleCandidates = useMemo(
    () =>
      sortCandidates(
        candidates.filter((candidate) => {
          const score = getCandidateDisplayedNeynarScore(candidate);
          return (
            typeof score !== 'number' || score >= LOW_NEYNAR_SCORE_THRESHOLD
          );
        }),
        candidateSortState,
      ),
    [candidateSortState, candidates],
  );
  const hiddenLowScoreCandidates = useMemo(
    () =>
      sortCandidates(
        candidates.filter((candidate) => {
          const score = getCandidateDisplayedNeynarScore(candidate);
          return (
            typeof score === 'number' && score < LOW_NEYNAR_SCORE_THRESHOLD
          );
        }),
        candidateSortState,
      ),
    [candidateSortState, candidates],
  );
  const selectedCandidates = useMemo(
    () =>
      visibleCandidates.filter((candidate) =>
        selectedCandidateFids.includes(getCandidateUser(candidate).fid),
      ),
    [selectedCandidateFids, visibleCandidates],
  );
  const visibleCandidateFids = useMemo(
    () => visibleCandidates.map((candidate) => getCandidateUser(candidate).fid),
    [visibleCandidates],
  );
  const seedUserProfile = seedUserQuery.data?.result;
  const seedUser = seedUserQuery.data?.result.user;
  const seedUserDisplayedNeynarScore = seedUserProfile
    ? getDisplayedNeynarScore(seedUserProfile)
    : undefined;
  const isSeedUserBelowLowScoreThreshold =
    typeof seedUserDisplayedNeynarScore === 'number' &&
    seedUserDisplayedNeynarScore < LOW_NEYNAR_SCORE_THRESHOLD;
  const canSelectSeedUser =
    typeof seedUser !== 'undefined' && !isSeedUserBelowLowScoreThreshold;
  const hasCandidateData = typeof candidateQuery.data !== 'undefined';
  const isCandidateFetching =
    candidateQuery.isPending || candidateQuery.isFetching;
  const selectedVisibleCandidateCount = useMemo(
    () =>
      visibleCandidateFids.filter((fid) => selectedCandidateFids.includes(fid))
        .length,
    [selectedCandidateFids, visibleCandidateFids],
  );
  const allVisibleCandidatesSelected =
    visibleCandidateFids.length > 0 &&
    selectedVisibleCandidateCount === visibleCandidateFids.length;

  const unauthorizedError =
    !isCandidateFetching &&
    !hasCandidateData &&
    candidateQuery.error &&
    isHandledFetchError(candidateQuery.error) &&
    candidateQuery.error.status === 403;

  const candidateError = useMemo(() => {
    if (unauthorizedError || hasCandidateData || isCandidateFetching) {
      return undefined;
    }

    return candidateQuery.error;
  }, [
    candidateQuery.error,
    hasCandidateData,
    isCandidateFetching,
    unauthorizedError,
  ]);

  useEffect(() => {
    setSelectedCandidateFids((currentSelectedCandidateFids) =>
      currentSelectedCandidateFids.filter((fid) =>
        visibleCandidateFids.includes(fid),
      ),
    );
  }, [visibleCandidateFids]);

  useEffect(() => {
    if (!canSelectSeedUser) {
      setIsSeedUserSelected(false);
    }
  }, [canSelectSeedUser]);

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const nextFid = parseAdminEngagementRingFid(inputValue);
      if (typeof nextFid === 'undefined') {
        setValidationError('Enter a valid numeric FID.');
        return;
      }

      setValidationError(undefined);
      setOverrideFeedback(undefined);
      setSelectedCandidateFids([]);
      setIsSeedUserSelected(false);
      setIsHiddenLowScoreExpanded(false);

      if (nextFid === submittedFid) {
        void candidateQuery.refetch();
        void seedUserQuery.refetch();
        return;
      }

      setSearchParams({ fid: nextFid.toString() });
    },
    [candidateQuery, inputValue, seedUserQuery, setSearchParams, submittedFid],
  );

  const onRetry = useCallback(() => {
    if (typeof submittedFid === 'undefined') {
      return;
    }

    void candidateQuery.refetch();
    void seedUserQuery.refetch();
  }, [candidateQuery, seedUserQuery, submittedFid]);

  const isLoading = isCandidateFetching && !hasCandidateData;

  const onToggleSelectAllCandidates = useCallback((fids: number[]) => {
    setSelectedCandidateFids((currentSelectedCandidateFids) => {
      const allSectionCandidatesSelected =
        fids.length > 0 &&
        fids.every((fid) => currentSelectedCandidateFids.includes(fid));

      if (allSectionCandidatesSelected) {
        return currentSelectedCandidateFids.filter(
          (fid) => !fids.includes(fid),
        );
      }

      const nextSelectedCandidateFids = new Set(currentSelectedCandidateFids);
      fids.forEach((fid) => {
        nextSelectedCandidateFids.add(fid);
      });
      return Array.from(nextSelectedCandidateFids);
    });
  }, []);

  const onToggleCandidateSelection = useCallback((fid: number) => {
    setSelectedCandidateFids((currentSelectedCandidateFids) =>
      currentSelectedCandidateFids.includes(fid)
        ? currentSelectedCandidateFids.filter(
            (selectedCandidateFid) => selectedCandidateFid !== fid,
          )
        : [...currentSelectedCandidateFids, fid],
    );
  }, []);

  const onToggleCandidateSort = useCallback((sortKey: CandidateSortKey) => {
    setCandidateSortState((currentSortState) =>
      getNextCandidateSortState(currentSortState, sortKey),
    );
  }, []);

  const selectedOverrideUsers = useMemo(
    () => [
      ...(isSeedUserSelected && seedUser
        ? [{ fid: seedUser.fid, username: seedUser.username, kind: 'seed' }]
        : []),
      ...selectedCandidates.map((candidate) => ({
        fid: getCandidateUser(candidate).fid,
        username: getCandidateUser(candidate).username,
        kind: 'candidate',
      })),
    ],
    [isSeedUserSelected, seedUser, selectedCandidates],
  );

  const onOverrideSelectedScores = useCallback(async () => {
    if (selectedOverrideUsers.length === 0 || isOverridingScores) {
      return;
    }

    const confirmed = window.confirm(
      `Override the Neynar score for ${selectedOverrideUsers.length} selected user${selectedOverrideUsers.length === 1 ? '' : 's'} to 0.3 with reason "engagement ring"?`,
    );

    if (!confirmed) {
      return;
    }

    setOverrideFeedback(undefined);
    setIsOverridingScores(true);

    try {
      const batchSize = 10;
      const results: PromiseSettledResult<unknown>[] = [];

      for (let i = 0; i < selectedOverrideUsers.length; i += batchSize) {
        const batch = selectedOverrideUsers.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((user) =>
            setNeynarScoreOverride({
              fid: user.fid,
              username: user.username,
              score: 0.3,
              reason: 'engagement ring',
            }),
          ),
        );
        results.push(...batchResults);
      }

      const successfulUsers = selectedOverrideUsers.filter(
        (_, index) => results[index]?.status === 'fulfilled',
      );
      const successfulCandidateFids = successfulUsers
        .filter((user) => user.kind === 'candidate')
        .map((user) => user.fid);
      const successfulSeedOverride = successfulUsers.some(
        (user) => user.kind === 'seed',
      );
      const successCount = successfulUsers.length;
      const failureCount = selectedOverrideUsers.length - successCount;

      if (successfulCandidateFids.length > 0) {
        setSelectedCandidateFids((currentSelectedCandidateFids) =>
          currentSelectedCandidateFids.filter(
            (fid) => !successfulCandidateFids.includes(fid),
          ),
        );
      }

      if (successfulSeedOverride) {
        setIsSeedUserSelected(false);
      }

      if (failureCount === 0) {
        setOverrideFeedback({
          kind: 'success',
          message: `Overrode ${successCount} user${successCount === 1 ? '' : 's'} to 0.3.`,
        });
      } else if (successCount === 0) {
        setOverrideFeedback({
          kind: 'error',
          message: 'Error overriding Neynar scores.',
        });
      } else {
        setOverrideFeedback({
          kind: 'error',
          message: `Overrode ${successCount} user${successCount === 1 ? '' : 's'} to 0.3. ${failureCount} failed.`,
        });
      }

      if (successCount > 0) {
        void candidateQuery.refetch();
        void seedUserQuery.refetch();
      }
    } catch {
      setOverrideFeedback({
        kind: 'error',
        message: 'Error overriding Neynar scores.',
      });
    } finally {
      setIsOverridingScores(false);
    }
  }, [
    candidateQuery,
    isOverridingScores,
    selectedOverrideUsers,
    seedUserQuery,
    setNeynarScoreOverride,
  ]);

  return (
    <Page meta={{ title: 'Engagement Ring Candidates' }}>
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto flex min-h-full w-full max-w-[1040px] flex-1 flex-col border-x border-default">
          <form
            onSubmit={onSubmit}
            className="flex flex-row flex-wrap items-end gap-3 border-b p-3 border-default"
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-default">Seed FID</span>
              <TextInput
                value={inputValue}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter an FID"
                onChange={(e) => {
                  setValidationError(undefined);
                  setInputValue((currentValue) => {
                    if (e.target.value === '' || e.target.validity.valid) {
                      return e.target.value;
                    }

                    return currentValue;
                  });
                }}
              />
            </label>
            <DefaultButton
              type="submit"
              className="min-w-[120px]"
              isLoading={isLoading}
            >
              Find candidates
            </DefaultButton>
          </form>

          {typeof validationError !== 'undefined' && (
            <div className="border-b px-4 py-2 text-sm border-default text-danger">
              {validationError}
            </div>
          )}

          {typeof submittedFid !== 'undefined' && !unauthorizedError && (
            <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3 bg-elevated border-default">
              <div className="flex min-w-0 flex-col">
                <div className="text-sm font-medium text-default">
                  {selectedOverrideUsers.length} selected
                </div>
                <div className="text-xs text-muted">
                  Override selected users to Neynar score 0.3 for engagement
                  ring activity.
                </div>
                {overrideFeedback ? (
                  <div
                    className={`mt-1 text-xs ${overrideFeedback.kind === 'error' ? 'text-danger' : 'text-muted'}`}
                  >
                    {overrideFeedback.message}
                  </div>
                ) : null}
              </div>
              <DefaultButton
                className="min-w-[220px]"
                disabled={
                  selectedOverrideUsers.length === 0 || isOverridingScores
                }
                isLoading={isOverridingScores}
                onClick={() => {
                  void onOverrideSelectedScores();
                }}
              >
                Override selected to 0.3
              </DefaultButton>
            </div>
          )}

          <div className="flex-1 p-4">
            {!hasSubmittedSearch ? (
              <DefaultEmptyListView message="Enter a seed FID to investigate engagement ring candidates." />
            ) : hasInvalidSearchFid ? (
              <DefaultEmptyListView message="Enter a valid numeric FID to inspect candidates." />
            ) : (
              <div className="flex flex-col gap-6">
                <section className="flex flex-col gap-3">
                  <SectionHeader title="Seed account" />
                  {seedUser ? (
                    <SeedUserCard
                      user={seedUser}
                      displayedNeynarScore={seedUserDisplayedNeynarScore}
                      isScoreOverridden={
                        seedUserProfile?.neynarScoreInfo?.overridden === true
                      }
                      isSelected={isSeedUserSelected}
                      canSelect={canSelectSeedUser}
                      onToggleSelection={() => {
                        setIsSeedUserSelected((currentValue) => !currentValue);
                      }}
                    />
                  ) : seedUserQuery.isPending ? (
                    <div className="flex items-center gap-2 rounded-xl border p-4 border-default">
                      <LoadingIndicator size="sm" />
                      <span className="text-sm text-muted">
                        Loading seed account...
                      </span>
                    </div>
                  ) : (
                    <InlineMessage message="Seed account unavailable." />
                  )}
                </section>

                <section className="flex flex-col gap-3">
                  <SectionHeader
                    title={`Candidates (${visibleCandidates.length})`}
                  />
                  {unauthorizedError ? (
                    <InlineMessage message="Not authorized. This tool is only available to internal team users." />
                  ) : typeof candidateError !== 'undefined' ? (
                    <InlineError
                      message={getErrorDescription(candidateError)}
                      onRetry={onRetry}
                    />
                  ) : isLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingIndicator size="lg" />
                    </div>
                  ) : visibleCandidates.length === 0 &&
                    hiddenLowScoreCandidates.length > 0 ? (
                    <InlineMessage message="All returned candidates are hidden below the Neynar score threshold." />
                  ) : visibleCandidates.length === 0 ? (
                    <DefaultEmptyListView message="No candidates found" />
                  ) : (
                    <div className="rounded-xl border border-default">
                      <div className="sticky top-0 z-10 overflow-hidden rounded-t-xl">
                        <CandidateTableHeader
                          allCandidatesSelected={allVisibleCandidatesSelected}
                          onToggleSelectAllCandidates={() => {
                            onToggleSelectAllCandidates(visibleCandidateFids);
                          }}
                          sortState={candidateSortState}
                          onToggleSort={onToggleCandidateSort}
                        />
                      </div>
                      <div className="overflow-hidden rounded-b-xl">
                        {visibleCandidates.map((candidate) => (
                          <CandidateUserCard
                            key={getCandidateUser(candidate).fid}
                            candidate={candidate}
                            isSelected={selectedCandidateFids.includes(
                              getCandidateUser(candidate).fid,
                            )}
                            onToggleSelection={onToggleCandidateSelection}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {hiddenLowScoreCandidates.length > 0 ? (
                  <section className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left bg-elevated border-default"
                      onClick={() => {
                        setIsHiddenLowScoreExpanded(
                          (currentValue) => !currentValue,
                        );
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold uppercase tracking-wide text-muted">
                          Hidden users with low scores (
                          {hiddenLowScoreCandidates.length})
                        </div>
                        <div className="text-xs text-muted">
                          Already below Neynar score{' '}
                          {LOW_NEYNAR_SCORE_THRESHOLD}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-default">
                        {isHiddenLowScoreExpanded ? 'Hide' : 'Show'}
                      </div>
                    </button>

                    {isHiddenLowScoreExpanded ? (
                      <div className="overflow-hidden rounded-xl border border-default">
                        <div className="sticky top-0 z-10 overflow-hidden">
                          <ReadOnlyCandidateTableHeader
                            sortState={candidateSortState}
                            onToggleSort={onToggleCandidateSort}
                          />
                        </div>
                        {hiddenLowScoreCandidates.map((candidate) => (
                          <ReadOnlyCandidateUserCard
                            key={getCandidateUser(candidate).fid}
                            candidate={candidate}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
});

const SectionHeader = memo(({ title }: { title: string }) => (
  <div className="text-sm font-semibold uppercase tracking-wide text-muted">
    {title}
  </div>
));

SectionHeader.displayName = 'SectionHeader';

const InlineMessage = memo(({ message }: { message: string }) => (
  <div className="rounded-xl border p-4 text-sm text-muted border-default">
    {message}
  </div>
));

InlineMessage.displayName = 'InlineMessage';

const InlineError = memo(
  ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="flex flex-col gap-3 rounded-xl border p-4 border-default">
      <div className="text-sm text-default">{message}</div>
      <div>
        <DefaultButton variant="secondary" onClick={onRetry}>
          Try again
        </DefaultButton>
      </div>
    </div>
  ),
);

InlineError.displayName = 'InlineError';

const SeedUserCard = memo(
  ({
    user,
    displayedNeynarScore,
    isScoreOverridden,
    isSelected,
    canSelect,
    onToggleSelection,
  }: {
    user: ApiUser;
    displayedNeynarScore?: number;
    isScoreOverridden: boolean;
    isSelected: boolean;
    canSelect: boolean;
    onToggleSelection: () => void;
  }) => (
    <div
      data-testid="seed-card"
      className="overflow-hidden rounded-xl border bg-app border-default"
    >
      <div className="engagement-ring-seed-grid hidden border-b text-xs font-semibold uppercase tracking-wide text-muted bg-elevated border-default md:grid">
        <div className="flex items-center justify-center border-r p-3 text-center border-default">
          &nbsp;
        </div>
        <div className="p-3">Seed user</div>
        <div className="flex items-center justify-center border-l p-3 text-center border-default">
          Neynar score
        </div>
        <div className="flex items-center justify-center border-l p-3 text-center border-default">
          Followers
        </div>
      </div>

      <div className="engagement-ring-seed-grid grid grid-cols-1">
        <div className="flex items-start justify-center px-3 pt-3 md:items-center md:border-r md:px-0 md:pt-0 md:border-default">
          <CheckboxInput
            aria-label="Select seed user"
            checked={isSelected}
            disabled={!canSelect}
            onChange={onToggleSelection}
          />
        </div>
        <div className="min-w-0 p-3">
          <User
            user={user}
            hideFollowButton
            withDetailsPopover={true}
            showBottomBorder={false}
          />
        </div>
        <NeynarScoreMetricCell
          displayedNeynarScore={displayedNeynarScore}
          isScoreOverridden={isScoreOverridden}
          withLeftBorder={true}
        />
        <CandidateMetricCell
          label="Followers"
          value={countFormatter.format(user.followerCount)}
        />
      </div>
    </div>
  ),
);

SeedUserCard.displayName = 'SeedUserCard';

const CandidateUserCard = memo(
  ({
    candidate,
    isSelected,
    onToggleSelection,
  }: {
    candidate: ApiEngagementRingCandidate;
    isSelected: boolean;
    onToggleSelection: (fid: number) => void;
  }) => {
    const candidateUser = getCandidateUser(candidate);

    return (
      <div
        data-testid={`candidate-card-${candidateUser.fid}`}
        className="engagement-ring-candidate-grid grid grid-cols-1 border-t bg-app border-default first:border-t-0"
      >
        <div className="flex flex-col items-center gap-2 px-3 pt-3 md:justify-center md:border-r md:px-0 md:pt-0 md:border-default">
          <CheckboxInput
            aria-label={`Select ${candidateUser.displayName ?? candidateUser.username ?? `fid ${candidateUser.fid}`}`}
            checked={isSelected}
            onChange={() => onToggleSelection(candidateUser.fid)}
          />
          <a
            className="text-[11px] uppercase tracking-wide text-muted hover:text-default"
            href={buildSeedHref(candidateUser.fid)}
          >
            seed
          </a>
        </div>
        <div className="min-w-0 p-3">
          <User
            user={candidateUser}
            hideFollowButton
            withDetailsPopover={true}
            showBottomBorder={false}
          />
        </div>
        <CandidateMetricCell
          label="Ring pair score"
          value={scoreFormatter.format(candidate.ringPairScore)}
        />
        <CandidateMetricCell
          label="Likes per liker"
          value={scoreFormatter.format(candidate.likesPerLiker)}
        />
        <CandidateMetricCell
          label="Top 10 liker share"
          value={percentageFormatter.format(candidate.top10LikerShare)}
        />
        <NeynarScoreMetricCell
          displayedNeynarScore={getCandidateDisplayedNeynarScore(candidate)}
          isScoreOverridden={
            candidate.user.neynarScoreInfo?.overridden === true
          }
          withLeftBorder={true}
        />
        <CandidateMetricCell
          label="Followers"
          value={countFormatter.format(candidateUser.followerCount)}
        />
        <CandidateMetricCell
          label="Likes received (30d)"
          value={countFormatter.format(candidate.totalLikesReceived)}
        />
      </div>
    );
  },
);

CandidateUserCard.displayName = 'CandidateUserCard';

const ReadOnlyCandidateUserCard = memo(
  ({ candidate }: { candidate: ApiEngagementRingCandidate }) => {
    const candidateUser = getCandidateUser(candidate);

    return (
      <div
        data-testid={`hidden-candidate-card-${candidateUser.fid}`}
        className="engagement-ring-candidate-grid grid grid-cols-1 border-t bg-app border-default first:border-t-0"
      >
        <div className="flex items-center justify-center px-3 pt-3 md:justify-center md:border-r md:px-0 md:pt-0 md:border-default">
          <a
            className="text-[11px] uppercase tracking-wide text-muted hover:text-default"
            href={buildSeedHref(candidateUser.fid)}
          >
            seed
          </a>
        </div>
        <div className="min-w-0 p-3">
          <User
            user={candidateUser}
            hideFollowButton
            withDetailsPopover={true}
            showBottomBorder={false}
          />
        </div>
        <CandidateMetricCell
          label="Ring pair score"
          value={scoreFormatter.format(candidate.ringPairScore)}
        />
        <CandidateMetricCell
          label="Likes per liker"
          value={scoreFormatter.format(candidate.likesPerLiker)}
        />
        <CandidateMetricCell
          label="Top 10 liker share"
          value={percentageFormatter.format(candidate.top10LikerShare)}
        />
        <NeynarScoreMetricCell
          displayedNeynarScore={getCandidateDisplayedNeynarScore(candidate)}
          isScoreOverridden={
            candidate.user.neynarScoreInfo?.overridden === true
          }
          withLeftBorder={true}
        />
        <CandidateMetricCell
          label="Followers"
          value={countFormatter.format(candidateUser.followerCount)}
        />
        <CandidateMetricCell
          label="Likes received (30d)"
          value={countFormatter.format(candidate.totalLikesReceived)}
        />
      </div>
    );
  },
);

ReadOnlyCandidateUserCard.displayName = 'ReadOnlyCandidateUserCard';

const CandidateTableHeader = memo(
  ({
    allCandidatesSelected,
    onToggleSelectAllCandidates,
    sortState,
    onToggleSort,
  }: {
    allCandidatesSelected: boolean;
    onToggleSelectAllCandidates: () => void;
    sortState: CandidateSortState;
    onToggleSort: (sortKey: CandidateSortKey) => void;
  }) => (
    <div className="engagement-ring-candidate-grid hidden border-b font-semibold uppercase tracking-wide text-muted bg-elevated border-default md:grid md:text-[10px] md:leading-tight">
      <div className="flex items-center justify-center border-r p-3 border-default">
        <CheckboxInput
          aria-label="Select all candidates"
          checked={allCandidatesSelected}
          onChange={onToggleSelectAllCandidates}
        />
      </div>
      <div className="p-3">Candidate</div>
      <SortableCandidateTableHeaderCell
        label="Ring pair score"
        sortKey="ringPairScore"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Likes per liker"
        sortKey="likesPerLiker"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Top 10 liker share"
        sortKey="top10LikerShare"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Neynar score"
        sortKey="neynarScore"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Followers"
        sortKey="followers"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Likes received (30d)"
        sortKey="totalLikesReceived"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
    </div>
  ),
);

CandidateTableHeader.displayName = 'CandidateTableHeader';

const ReadOnlyCandidateTableHeader = memo(
  ({
    sortState,
    onToggleSort,
  }: {
    sortState: CandidateSortState;
    onToggleSort: (sortKey: CandidateSortKey) => void;
  }) => (
    <div className="engagement-ring-candidate-grid hidden border-b font-semibold uppercase tracking-wide text-muted bg-elevated border-default md:grid md:text-[10px] md:leading-tight">
      <div className="p-3 text-center">&nbsp;</div>
      <div className="p-3">Candidate</div>
      <SortableCandidateTableHeaderCell
        label="Ring pair score"
        sortKey="ringPairScore"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Likes per liker"
        sortKey="likesPerLiker"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Top 10 liker share"
        sortKey="top10LikerShare"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Neynar score"
        sortKey="neynarScore"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Followers"
        sortKey="followers"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
      <SortableCandidateTableHeaderCell
        label="Likes received (30d)"
        sortKey="totalLikesReceived"
        sortState={sortState}
        onToggleSort={onToggleSort}
      />
    </div>
  ),
);

ReadOnlyCandidateTableHeader.displayName = 'ReadOnlyCandidateTableHeader';

const SortableCandidateTableHeaderCell = memo(
  ({
    label,
    sortKey,
    sortState,
    onToggleSort,
  }: {
    label: string;
    sortKey: CandidateSortKey;
    sortState: CandidateSortState;
    onToggleSort: (sortKey: CandidateSortKey) => void;
  }) => {
    const isActive = sortState?.key === sortKey;
    const indicator = !isActive
      ? '↕'
      : sortState.direction === 'desc'
        ? '↓'
        : '↑';

    return (
      <div
        aria-sort={
          !isActive
            ? 'none'
            : sortState.direction === 'desc'
              ? 'descending'
              : 'ascending'
        }
        className="flex items-stretch justify-center border-l border-default"
      >
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 p-3 text-center leading-tight hover:text-default"
          onClick={() => {
            onToggleSort(sortKey);
          }}
        >
          <span>{label}</span>
          <span aria-hidden="true" className="text-[11px] normal-case">
            {indicator}
          </span>
        </button>
      </div>
    );
  },
);

SortableCandidateTableHeaderCell.displayName =
  'SortableCandidateTableHeaderCell';

const NeynarScoreMetricCell = memo(
  ({
    displayedNeynarScore,
    isScoreOverridden,
    withLeftBorder = false,
  }: {
    displayedNeynarScore?: number;
    isScoreOverridden: boolean;
    withLeftBorder?: boolean;
  }) => (
    <div
      className={`relative flex items-center justify-between gap-3 border-t px-3 py-2 border-default md:justify-center md:border-t-0 md:px-4 md:py-3 ${withLeftBorder ? 'md:border-l' : ''}`}
    >
      <div className="text-xs uppercase tracking-wide text-muted md:hidden">
        Neynar score
      </div>
      <div className="text-sm font-medium text-default md:text-center">
        {formatNeynarScore(displayedNeynarScore)}
      </div>
      {isScoreOverridden ? (
        <div className="pointer-events-none absolute bottom-1 left-1/2 hidden -translate-x-1/2 text-[11px] uppercase tracking-wide text-muted md:block">
          overridden
        </div>
      ) : null}
    </div>
  ),
);

NeynarScoreMetricCell.displayName = 'NeynarScoreMetricCell';

const CandidateMetricCell = memo(
  ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-3 border-t px-3 py-2 border-default md:justify-center md:border-l md:border-t-0 md:px-4 md:py-3">
      <div className="text-xs uppercase tracking-wide text-muted md:hidden">
        {label}
      </div>
      <div className="text-sm font-medium text-default md:whitespace-nowrap">
        {value}
      </div>
    </div>
  ),
);

CandidateMetricCell.displayName = 'CandidateMetricCell';

AdminEngagementRingCandidatesPage.displayName =
  'AdminEngagementRingCandidatesPage';
AdminEngagementRingCandidatesContent.displayName =
  'AdminEngagementRingCandidatesContent';

export {
  AdminEngagementRingCandidatesContent,
  AdminEngagementRingCandidatesPage,
};
