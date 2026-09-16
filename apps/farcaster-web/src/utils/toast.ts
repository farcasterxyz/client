import type { ReactNode } from 'react';
import {
  Slide,
  // eslint-disable-next-line no-restricted-imports
  toast as rtToast,
  type ToastContainerProps,
} from 'react-toastify';

export const toastOptions: ToastContainerProps = {
  autoClose: 3000,
  hideProgressBar: true,
  transition: Slide,
  pauseOnHover: false,
  closeOnClick: true,
  pauseOnFocusLoss: false,
  closeButton: false,
  icon: false,
  theme: 'dark',
  position: 'top-center',
  toastClassName: 'rounded-xl',
};

export function toast({
  message,
  type = 'info',
  toastId,
  position = 'top-center',
}: {
  message: string | ReactNode;
  type?: 'info' | 'success' | 'error' | 'custom';
  toastId?: string;
  position?: 'top-center' | 'bottom-center';
}) {
  // Delay toast by 200ms to avoid jumping to the left if triggered from a confirmation modal.
  // The issue is that on the confirmation modal we use an overlay and the browser hides the scrollbar.
  // If shown there, the toast is right in the middle of the screen. But then when the confirmation
  // overlay closes, the browser shows the scrollbar, which makes the viewport smaller, and the
  // toast moves a little to the left.
  setTimeout(() => {
    if (type === 'info') {
      rtToast.info(message, { toastId, position });
    } else if (type === 'success') {
      rtToast.success(message, { toastId, position });
    } else if (type === 'error') {
      rtToast.error(message, { toastId, position });
    } else if (type === 'custom') {
      rtToast(message, { toastId, position });
    }
  }, 200);
}
