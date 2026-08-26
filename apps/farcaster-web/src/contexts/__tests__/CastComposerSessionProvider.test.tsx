// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  CastComposerSessionProvider,
  useCastComposerSession,
} from '~/contexts/CastComposerSessionProvider';

vi.mock('~/components/modals/ComposeCastModal', () => ({
  ComposeCastModal: ({
    backgrounded,
    onClose,
  }: {
    backgrounded?: boolean;
    onClose: () => void;
  }) => (
    <div data-testid="composer-modal" data-backgrounded={String(backgrounded)}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

function HeaderHarness() {
  const {
    hasBackgroundedSession,
    openComposer,
    resumeComposer,
    backgroundComposer,
    isComposerOpen,
  } = useCastComposerSession();

  return (
    <>
      <button
        onClick={() => {
          if (hasBackgroundedSession) {
            resumeComposer();
            return;
          }
          openComposer();
        }}
      >
        {hasBackgroundedSession ? 'Resume' : 'Cast'}
      </button>
      <button onClick={backgroundComposer}>Background</button>
      <div data-testid="open-state">{String(isComposerOpen)}</div>
    </>
  );
}

function renderHarness() {
  render(
    <JotaiProvider>
      <CastComposerSessionProvider>
        <HeaderHarness />
      </CastComposerSessionProvider>
    </JotaiProvider>,
  );
}

describe('CastComposerSessionProvider', () => {
  it('backgrounds and resumes the same mounted composer session', () => {
    renderHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Cast' }));

    expect(screen.getByTestId('composer-modal').dataset.backgrounded).toBe(
      'false',
    );
    expect(screen.getByTestId('open-state').textContent).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Background' }));

    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    expect(screen.getByTestId('composer-modal').dataset.backgrounded).toBe(
      'true',
    );
    expect(screen.getByTestId('open-state').textContent).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    expect(screen.getByRole('button', { name: 'Cast' })).toBeTruthy();
    expect(screen.getByTestId('composer-modal').dataset.backgrounded).toBe(
      'false',
    );
    expect(screen.getByTestId('open-state').textContent).toBe('true');
  });
});
