export const isError = (error: unknown): error is Error =>
  error instanceof Error;

export const isCryptographyError = (
  error: unknown,
): error is CryptographyError => error instanceof CryptographyError;

export type CryptographyErrorOptions<T extends object = object> = {
  error?: unknown;
} & T;

export class CryptographyError extends Error {
  readonly error?: unknown;

  constructor(name: string, { error }: CryptographyErrorOptions) {
    super(name);
    this.error = error;
  }
}

export class EmbargoedCryptographyError extends Error {
  readonly error?: unknown;
  constructor(name: string, { error }: CryptographyErrorOptions) {
    super(name);
    this.error = error;
  }
}

interface InvalidInputErrorOptions {
  message: string;
  input: string;
}

export class InvalidInputError extends CryptographyError {
  //a

  constructor(options: CryptographyErrorOptions<InvalidInputErrorOptions>) {
    super(options.message, options);
    //this.absoluteUrl = options.absoluteUrl;
  }
}

interface MaliciousInputErrorOptions {
  message: string;
}

export class MaliciousInputError extends CryptographyError {
  //a

  constructor(options: CryptographyErrorOptions<MaliciousInputErrorOptions>) {
    super(options.message, options);
    //this.absoluteUrl = options.absoluteUrl;
  }
}

interface IrrecoverableStateErrorOptions {
  message: string;
}

export class IrrecoverableStateError extends CryptographyError {
  //a

  constructor(
    options: CryptographyErrorOptions<IrrecoverableStateErrorOptions>,
  ) {
    super(options.message, options);
    //this.absoluteUrl = options.absoluteUrl;
  }
}

interface UnexpectedStateErrorOptions {
  message: string;
}

export class UnexpectedStateError extends CryptographyError {
  //a

  constructor(options: CryptographyErrorOptions<UnexpectedStateErrorOptions>) {
    super(options.message, options);
    //this.absoluteUrl = options.absoluteUrl;
  }
}

interface ConflictingStateErrorOptions {
  message: string;
}

export class ConflictingStateError extends CryptographyError {
  //a

  constructor(options: CryptographyErrorOptions<ConflictingStateErrorOptions>) {
    super(options.message, options);
    //this.absoluteUrl = options.absoluteUrl;
  }
}

export type InputError = InvalidInputError | MaliciousInputError;
export type StateError =
  | IrrecoverableStateError
  | UnexpectedStateError
  | ConflictingStateError;

export function isInvalidInputError(
  error: unknown,
): error is InvalidInputError {
  return !!(error && (error as Error).constructor === InvalidInputError);
}

export function isMaliciousInputError(
  error: unknown,
): error is MaliciousInputError {
  return !!(error && (error as Error).constructor === MaliciousInputError);
}

export function isIrrecoverableStateError(
  error: unknown,
): error is IrrecoverableStateError {
  return !!(error && (error as Error).constructor === IrrecoverableStateError);
}

export function isUnexpectedStateError(
  error: unknown,
): error is UnexpectedStateError {
  return !!(error && (error as Error).constructor === UnexpectedStateError);
}

export function isConflictingStateError(
  error: unknown,
): error is ConflictingStateError {
  return !!(error && (error as Error).constructor === ConflictingStateError);
}

export function isInputError(
  error: unknown,
): error is MaliciousInputError | IrrecoverableStateError {
  return isMaliciousInputError(error) || isIrrecoverableStateError(error);
}

export function isStateError(
  error: unknown,
): error is
  | IrrecoverableStateError
  | UnexpectedStateError
  | ConflictingStateError {
  return (
    isIrrecoverableStateError(error) ||
    isUnexpectedStateError(error) ||
    isConflictingStateError(error)
  );
}
