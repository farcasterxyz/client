// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SpaceAlertModal } from '~/components/spaces/SpaceAlertModal';
import { modalRootId } from '~/constants/modals';

const keyPressListeners: Array<(e: KeyboardEvent) => void> = [];

vi.mock('~/contexts/GlobalKeyPressProvider', () => ({
  useGlobalKeyPress: () => ({
    addKeyPressListener: (callback: (e: KeyboardEvent) => void) => {
      keyPressListeners.push(callback);
      return () => {
        const index = keyPressListeners.indexOf(callback);
        if (index !== -1) {
          keyPressListeners.splice(index, 1);
        }
      };
    },
  }),
}));

vi.mock('~/components/modals/Modal', async () => {
  const React = await import('react');

  return {
    Modal: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

vi.mock('~/components/modals/DefaultModalContent', async () => {
  const React = await import('react');

  return {
    DefaultModalContent: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        'div',
        {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
          },
        },
        children,
      ),
  };
});

const renderSpaceAlertModal = ({ onClose }: { onClose: () => void }) =>
  render(
    <SpaceAlertModal
      open={true}
      title="Removed from Space"
      body="You were removed from this Space by the host."
      onClose={onClose}
    />,
  );

describe('SpaceAlertModal', () => {
  beforeEach(() => {
    keyPressListeners.length = 0;
    const modalRoot = document.createElement('div');
    modalRoot.id = modalRootId;
    document.body.appendChild(modalRoot);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('calls onClose when OK is clicked', () => {
    const onClose = vi.fn();

    renderSpaceAlertModal({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();

    renderSpaceAlertModal({ onClose });

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).not.toBeNull();

    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();

    renderSpaceAlertModal({ onClose });

    await waitFor(() => {
      expect(keyPressListeners).toHaveLength(1);
    });

    keyPressListeners[0](new KeyboardEvent('keyup', { code: 'Escape' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
