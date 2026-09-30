export const base64ToBase64Url = (value: string) => {
  return value.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

export const base64UrlEncode = (value: string) => {
  return base64ToBase64Url(Buffer.from(value, 'utf-8').toString('base64'));
};
