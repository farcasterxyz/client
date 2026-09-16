type SnapLiftRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const HIT_SLOP = 8;
// The lifted portal can briefly report a window Y below its visual top while it
// settles. Keep the active hit box forgiving above the card so taps on the
// Snap's top edge are never treated as outside-dismiss taps.
const TOP_HIT_SLOP = 96;
const DISMISS_TAP_CONSUME_MS = 500;
const SNAP_INTERACTION_TAP_CONSUME_MS = 500;
const RESEAT_LIFT_SUPPRESSION_MS = 500;

let activeLiftId: string | null = null;
let activeLiftRect: SnapLiftRect | null = null;
let lastOutsideDismissAt = 0;
let lastSnapInteractionAt = 0;
let suppressNextSnapLiftUntil = 0;

const activeLiftListeners = new Set<(activeId: string | null) => void>();

function notifyActiveLiftListeners() {
  activeLiftListeners.forEach((listener) => listener(activeLiftId));
}

export function setActiveSnapLift(activeId: string | null) {
  activeLiftId = activeId;
  if (!activeId) {
    activeLiftRect = null;
  }
  notifyActiveLiftListeners();
}

export function clearActiveSnapLift(activeId?: string): boolean {
  if (!activeLiftId) {
    return false;
  }

  if (activeId && activeLiftId !== activeId) {
    return false;
  }

  setActiveSnapLift(null);
  return true;
}

export function isActiveSnapLift(activeId: string): boolean {
  return activeLiftId === activeId;
}

export function updateActiveSnapLiftRect(activeId: string, rect: SnapLiftRect) {
  if (activeLiftId !== activeId) {
    return;
  }

  activeLiftRect = rect;
}

export function markSnapLiftInteraction() {
  lastSnapInteractionAt = Date.now();
}

export function suppressNextSnapLiftAfterReseat() {
  suppressNextSnapLiftUntil = Date.now() + RESEAT_LIFT_SUPPRESSION_MS;
}

export function consumeSnapLiftAfterReseatSuppression(): boolean {
  if (
    suppressNextSnapLiftUntil === 0 ||
    Date.now() > suppressNextSnapLiftUntil
  ) {
    suppressNextSnapLiftUntil = 0;
    return false;
  }

  suppressNextSnapLiftUntil = 0;
  return true;
}

export function subscribeToActiveSnapLift(
  listener: (activeId: string | null) => void,
): () => void {
  activeLiftListeners.add(listener);
  return () => {
    activeLiftListeners.delete(listener);
  };
}

export function dismissActiveSnapLiftFromOutsideTouch({
  pageX,
  pageY,
}: {
  pageX: number;
  pageY: number;
}): boolean {
  if (!activeLiftId) {
    return false;
  }

  if (
    activeLiftRect &&
    pageX >= activeLiftRect.x - HIT_SLOP &&
    pageX <= activeLiftRect.x + activeLiftRect.width + HIT_SLOP &&
    pageY >= activeLiftRect.y - TOP_HIT_SLOP &&
    pageY <= activeLiftRect.y + activeLiftRect.height + HIT_SLOP
  ) {
    return false;
  }

  const dismissed = clearActiveSnapLift();
  if (dismissed) {
    lastOutsideDismissAt = Date.now();
  }
  return dismissed;
}

export function consumeRecentSnapLiftDismissal(): boolean {
  const now = Date.now();
  const recentlyDismissed =
    now - lastOutsideDismissAt <= DISMISS_TAP_CONSUME_MS;
  const recentlyInteracted =
    now - lastSnapInteractionAt <= SNAP_INTERACTION_TAP_CONSUME_MS;

  if (recentlyDismissed) {
    lastOutsideDismissAt = 0;
  }

  if (recentlyInteracted) {
    lastSnapInteractionAt = 0;
  }

  return recentlyDismissed || recentlyInteracted;
}
