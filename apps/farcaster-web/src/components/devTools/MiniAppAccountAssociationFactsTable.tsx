import {
  ApiAccountAssociationValidation,
  ApiDecodedAccountAssociation,
  ApiJsonFarcasterSignature,
} from 'farcaster-client-data';
import { useDevToolsDecodeAccountAssociation } from 'farcaster-client-hooks';
import { useEffect, useState } from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';

const StatusIndicator = ({ isValid }: { isValid: boolean }) => (
  <span className={isValid ? 'text-success' : 'text-danger'}>
    {isValid ? '✓' : '✕'}
  </span>
);

const MiniAppAccountAssociationFactsTable = ({
  hideHeader = false,
  validation,
  expectedDomain,
  accountAssociation,
  onDecode,
}: {
  hideHeader?: boolean;
  expectedDomain?: string;
  validation: ApiAccountAssociationValidation;
  accountAssociation: ApiJsonFarcasterSignature | undefined;
  onDecode?: (decoded: ApiDecodedAccountAssociation) => void;
}) => {
  const decodeAccountAssociation = useDevToolsDecodeAccountAssociation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [decoded, setDecoded] = useState<
    ApiDecodedAccountAssociation | undefined
  >(undefined);

  useEffect(() => {
    if (accountAssociation) {
      setIsLoading(true);
      decodeAccountAssociation(accountAssociation)
        .then((data) => {
          setDecoded(data);
          if (onDecode) {
            onDecode(data);
          }
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    }
  }, [accountAssociation, decodeAccountAssociation, onDecode]);

  if (!decoded) {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-2">
          {!hideHeader && (
            <div className="font-medium text-muted">
              Account Association Details
            </div>
          )}
          <div className="flex h-[250px] min-w-[422px] flex-col rounded-lg border border-faint">
            <div className="flex h-full items-center justify-center">
              <LoadingIndicator />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col gap-2">
          {!hideHeader && (
            <div className="font-medium text-muted">
              Account Association Details
            </div>
          )}
          <div className="flex h-[250px] min-w-[422px] flex-col rounded-lg border border-faint">
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-muted">
                No account association found
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!hideHeader && (
        <div className="font-medium text-muted">
          Account Association Details
        </div>
      )}
      <div className="flex min-w-[422px] flex-col rounded-lg border border-faint">
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">Domain</div>
          <div className="flex-1 p-3 text-sm font-medium">
            <span className="ml-2">{decoded?.domain || '-'}</span>
          </div>
        </div>
        {expectedDomain && (
          <div className="flex border-b border-faint">
            <div className="w-1/3 p-3 text-sm bg-faint">Domain Matches</div>
            <div className="flex-1 p-3 text-sm font-medium">
              {decoded?.domain === expectedDomain ? (
                <StatusIndicator isValid={true} />
              ) : (
                <StatusIndicator isValid={false} />
              )}
            </div>
          </div>
        )}
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">Signed by</div>
          <div className="flex-1 p-3 text-sm font-medium">
            <span className="ml-2">
              {decoded?.username || decoded?.fid
                ? `${decoded?.username || ''} (${decoded?.fid || ''})`
                : '-'}
            </span>
          </div>
        </div>
        <div className="flex">
          <div className="w-1/3 p-3 text-sm bg-faint">Signature</div>
          <div className="flex-1 p-3 text-sm font-medium">
            {validation.signatureValid ? (
              <>
                <StatusIndicator isValid={true} />
                <span className="ml-2">Verified</span>
              </>
            ) : (
              <>
                <StatusIndicator isValid={false} />
                <span className="ml-2">
                  {decoded?.signature ? 'Invalid' : 'Missing'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { MiniAppAccountAssociationFactsTable };
