const buildVerificationsKey = ({ fid }: { fid: number | undefined }) => [
  'verifications',
  fid,
];

export { buildVerificationsKey };
