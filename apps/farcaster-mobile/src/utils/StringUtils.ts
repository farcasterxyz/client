// Ensure that stringify always returns a string and never undefined.
const safeStringify = (value: unknown) => {
  if (value === undefined) {
    return JSON.stringify(null);
  }

  return JSON.stringify(value);
};

const insert = (str: string, index: number, value: string) => {
  return str.substr(0, index) + value + str.substr(index);
};

const splice = (
  text: string,
  start: number,
  end: number,
  replacement: string,
) => {
  return text.slice(0, start) + replacement + text.slice(end);
};

export { insert, safeStringify, splice };
