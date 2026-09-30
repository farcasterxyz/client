// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ComposerErrorBoundary } from '~/components/composer/components/ComposerErrorBoundary';

const mocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({
    trackEvent: mocks.trackEvent,
  }),
}));

vi.mock('~/utils/errorUtils', () => ({
  trackError: mocks.trackError,
}));

vi.mock('~/components/forms/buttons/DefaultButton', async () => {
  const React = await import('react');

  return {
    DefaultButton: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick: () => void;
    }) => React.createElement('button', { onClick }, children),
  };
});

const BrokenComposer = () => {
  throw new Error('composer exploded');
};

describe('ComposerErrorBoundary', () => {
  beforeEach(() => {
    mocks.trackEvent.mockReset();
    mocks.trackError.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.history.replaceState({}, '', '/wake/0xe7e52e5f?includeReason=home');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks the thrown error with safe composer debug data', () => {
    render(
      <ComposerErrorBoundary
        debugData={{
          is_reply: true,
          parent_cast_hash: '0xe7e52e5f',
        }}
        getDebugData={() => ({
          composer_cast_count: 2,
          composer_total_text_length: 42,
        })}
      >
        <BrokenComposer />
      </ComposerErrorBoundary>,
    );

    expect(
      screen.getByText(
        'The composer hit an unexpected error. Please try again.',
      ),
    ).toBeTruthy();
    expect(mocks.trackError).toHaveBeenCalledTimes(1);
    expect(mocks.trackEvent).toHaveBeenCalledWith(
      AnalyticsEvent.CastComposerErrorBoundaryCaught,
      expect.objectContaining({
        route_pathname: '/wake/0xe7e52e5f',
        route_search_keys: 'includeReason',
        is_reply: true,
        parent_cast_hash: '0xe7e52e5f',
        composer_cast_count: 2,
        composer_total_text_length: 42,
        error_name: 'Error',
        error_message: 'composer exploded',
      }),
    );
  });

  it('tracks retry attempts from the fallback', () => {
    render(
      <ComposerErrorBoundary
        debugData={{
          is_reply: true,
        }}
      >
        <BrokenComposer />
      </ComposerErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(mocks.trackEvent).toHaveBeenCalledWith(
      AnalyticsEvent.CastComposerErrorBoundaryTryAgainPressed,
      expect.objectContaining({
        route_pathname: '/wake/0xe7e52e5f',
        is_reply: true,
      }),
    );
  });
});
