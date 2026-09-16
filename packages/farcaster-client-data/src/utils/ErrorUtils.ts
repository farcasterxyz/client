import { BaseError, isError, isFarcasterError } from '../types/errors';

const linebreak = '\n';
const divider = linebreak + linebreak;

const stringifyError = (error: unknown, includeCause = true) => {
  const output: string[] = [];

  if (error instanceof BaseError) {
    output.push(error.toString());

    Object.keys(error)
      .filter((key) => key !== 'error')
      .forEach((key) => {
        output.push(`...${key}: ${error[key as keyof typeof error]}`);
      });

    const nestedError = error.cause;
    if (isFarcasterError(nestedError)) {
      output.push(`...error: ${nestedError}`);
      Object.keys(nestedError).forEach((key) => {
        let value = nestedError[key as keyof typeof nestedError];
        try {
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
        } catch {
          // no-op
        }

        output.push(`......${key}: ${value}`);
      });
    } else {
      if (isError(nestedError)) {
        output.push(`...unwrappedErrorMessage: ${nestedError?.message}`);
        output.push(`...unwrappedErrorStack: ${nestedError?.stack}`);
      }
    }
  } else if (isError(error)) {
    if (error.stack) {
      output.push(error.stack);
    } else {
      output.push(error.toString());
    }
    if (error.cause && includeCause) {
      output.push(`...cause: ${stringifyError(error.cause, false)}`);
    }
  } else {
    output.push(String(error));
  }

  output.push(divider);
  return output.join(linebreak);
};

export { stringifyError };
