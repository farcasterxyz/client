import { ApiDomainFrameConfig, ApiDomainManifest } from 'farcaster-client-data';
import React from 'react';

import { useFarcasterJsonSchema } from '~/hooks/devTools/useFarcasterJsonSchema';

interface ManifestDifferencesProps {
  frameConfig?: ApiDomainFrameConfig;
  manifest: ApiDomainManifest;
}

export const ManifestDifferences: React.FC<ManifestDifferencesProps> = ({
  frameConfig,
  manifest,
}) => {
  const getSchema = useFarcasterJsonSchema();
  const schema = getSchema();

  if (!frameConfig || !manifest.frame) {
    return null;
  }

  const differences: React.ReactNode[] = [];

  // Compare all fields from the schema
  schema.forEach((propertySchema) => {
    const field = propertySchema.field;
    const currentValue = frameConfig[field];
    const manifestValue = (manifest.frame as ApiDomainFrameConfig)[field];

    if (currentValue !== manifestValue) {
      differences.push(
        <span key={field} className="text-sm text-danger">
          <code>{field}</code> is different
        </span>,
      );
    }
  });

  if (differences.length === 0) {
    return (
      <span className="text-sm text-success">No differences detected</span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium">Differences detected:</span>
      <ul className="list-disc pl-5">
        {differences.map((diff, index) => (
          <li key={index} className="text-sm text-muted">
            {diff}
          </li>
        ))}
      </ul>
    </div>
  );
};
