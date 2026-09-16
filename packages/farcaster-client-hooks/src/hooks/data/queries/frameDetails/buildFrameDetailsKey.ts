export const buildFrameDetailsKey = ({
  domain,
  id,
}: {
  domain?: string;
  id?: string;
}) => ['frameDetails', domain, id];
