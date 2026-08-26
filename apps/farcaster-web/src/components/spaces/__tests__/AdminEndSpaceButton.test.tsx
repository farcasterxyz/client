// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminEndSpaceButton } from '~/components/spaces/AdminEndSpaceButton';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { toast } from '~/utils/toast';

const mockEndAudioRoom = vi.fn();

vi.mock('farcaster-client-hooks', () => ({
  useEndAudioRoom: () => mockEndAudioRoom,
}));

vi.mock('~/hooks/data/useIsAdmin', () => ({
  useIsAdmin: vi.fn(),
}));

vi.mock('~/utils/toast', () => ({
  toast: vi.fn(),
}));

describe('AdminEndSpaceButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsAdmin).mockReturnValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render for non-admins', () => {
    vi.mocked(useIsAdmin).mockReturnValue(false);

    render(<AdminEndSpaceButton roomId="room-1" roomState="live" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not call mutation when confirmation is rejected', () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<AdminEndSpaceButton roomId="room-1" roomState="live" />);

    fireEvent.click(screen.getByRole('button', { name: 'Admin End' }));

    expect(mockEndAudioRoom).not.toHaveBeenCalled();
  });

  it('ends room and calls callback on success', async () => {
    mockEndAudioRoom.mockResolvedValue(undefined);
    const onEnded = vi.fn();

    render(
      <AdminEndSpaceButton
        roomId="room-2"
        roomState="scheduled"
        onEnded={onEnded}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Admin Cancel' }));

    await waitFor(() => {
      expect(mockEndAudioRoom).toHaveBeenCalledWith({ roomId: 'room-2' });
    });

    expect(toast).toHaveBeenCalledWith({
      message: 'Space cancelled',
      type: 'success',
    });
    expect(onEnded).toHaveBeenCalled();
  });

  it('shows error toast when mutation fails', async () => {
    mockEndAudioRoom.mockRejectedValue(new Error('No permission'));

    render(<AdminEndSpaceButton roomId="room-3" roomState="live" />);

    fireEvent.click(screen.getByRole('button', { name: 'Admin End' }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        message: 'No permission',
        type: 'error',
      });
    });
  });

  it('does not show error when onEnded callback throws', async () => {
    mockEndAudioRoom.mockResolvedValue(undefined);
    const onEnded = vi.fn().mockRejectedValue(new Error('nav failed'));

    render(
      <AdminEndSpaceButton
        roomId="room-4"
        roomState="live"
        onEnded={onEnded}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Admin End' }));

    await waitFor(() => {
      expect(mockEndAudioRoom).toHaveBeenCalledWith({ roomId: 'room-4' });
      expect(onEnded).toHaveBeenCalled();
    });

    expect(toast).toHaveBeenCalledWith({
      message: 'Space ended',
      type: 'success',
    });
    expect(toast).not.toHaveBeenCalledWith({
      message: 'nav failed',
      type: 'error',
    });
  });
});
