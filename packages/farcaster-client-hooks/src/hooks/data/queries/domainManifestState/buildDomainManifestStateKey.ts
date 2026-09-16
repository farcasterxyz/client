export const buildDomainManifestStateKey = ({
  domain,
  manifest,
}: {
  domain?: string;
  manifest?: string;
}) => ['domainManifestState', domain, manifest] as const;
