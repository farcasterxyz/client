import {
  clearActiveSnapLift,
  consumeSnapLiftAfterReseatSuppression,
  setActiveSnapLift,
  subscribeToActiveSnapLift,
  suppressNextSnapLiftAfterReseat,
} from '../snapLiftState';

describe('snap lift state', () => {
  afterEach(() => {
    clearActiveSnapLift();
    jest.restoreAllMocks();
  });

  it('notifies the lifted Snap when navigation clears the active lift', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToActiveSnapLift(listener);

    setActiveSnapLift('snap-1');

    expect(clearActiveSnapLift()).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
  });

  it('consumes the next lift after a reseat', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    suppressNextSnapLiftAfterReseat();

    expect(consumeSnapLiftAfterReseatSuppression()).toBe(true);
    expect(consumeSnapLiftAfterReseatSuppression()).toBe(false);
  });

  it('does not suppress lifts after the carried touch has expired', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    suppressNextSnapLiftAfterReseat();
    jest.spyOn(Date, 'now').mockReturnValue(1_501);

    expect(consumeSnapLiftAfterReseatSuppression()).toBe(false);
  });
});
