/**
 * Returns a new object that is the result of applying the given options
 * on top of default options, only overriding valeus when the options value is not undefined.
 * @param defaults - The default options.
 * @param options - The user-given options.
 * @returns The merged options.
 */
function mergeIntoDefaultOptions<T>({
  defaults,
  options,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaults: Record<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<any, any>;
}): T {
  const mergedOptions = { ...defaults };

  for (const key in options) {
    if (options[key] !== undefined) {
      mergedOptions[key] = options[key];
    }
  }

  return mergedOptions as T;
}

export { mergeIntoDefaultOptions };
