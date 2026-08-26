export type RequestRelativeUrl = `/${string}`;

export type RequestHeaders = Record<string, string>;

export type RequestMethod = 'GET' | 'PATCH' | 'POST' | 'PUT' | 'DELETE';

export type RequestParams = Record<
  string,
  string | number | boolean | null | undefined | string[] | number[] | boolean[]
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestData = any;
