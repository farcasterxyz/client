import React, { ReactNode } from 'react';

export function DialogPanelContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
      {children}
    </div>
  );
}

export function DialogBackdrop() {
  return (
    <div
      className="backdrop-blur-xs fixed inset-0 bg-black/15 dark:bg-white/15"
      aria-hidden="true"
    />
  );
}
