const getAbsoluteUrl = ({
  host,
  path = '',
}: {
  host: string | undefined;
  path?: string;
}) => {
  return `${host}${path}`;
};

const getFallbackUrl = ({ host }: { host: string | undefined }) => {
  return `${host}`;
};

export { getAbsoluteUrl, getFallbackUrl };
