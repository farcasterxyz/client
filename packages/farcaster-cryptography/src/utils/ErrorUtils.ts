import { isCryptographyError, isError } from '../types/errors';

const linebreak = '\n';
const divider =
  linebreak +
  '######################################################################' +
  linebreak;

const stringifyError = (error: unknown) => {
  const output: string[] = [divider];

  if (isCryptographyError(error)) {
    output.push(error.constructor.name);
    output.push(`...message: ${error.message}`);

    Object.keys(error)
      .filter((key) => key !== 'error')
      .forEach((key) => {
        output.push(`...${key}: ${error[key as keyof typeof error]}`);
      });

    if (isError(error.error)) {
      output.push(`...unwrappedErrorMessage: ${error.error?.message}`);
      output.push(`...unwrappedErrorStack: ${error.error?.stack}`);
    }
  } else if (isError(error)) {
    output.push(error.name);
    output.push(`...message: ${error.message}`);
    output.push(`...stack: ${error.stack}`);
  } else {
    output.push(String(error));
  }

  output.push(divider);
  return output.join(linebreak);
};

export { stringifyError };
