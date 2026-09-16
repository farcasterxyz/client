import { ApiDevToolsMiniAppUrlFacts } from 'farcaster-client-data';
import { useDevToolsInspectMiniAppUrl } from 'farcaster-client-hooks';
import { useEffect, useMemo } from 'react';

const StatusIndicator = ({ isValid }: { isValid: boolean }) => (
  <span className={isValid ? 'text-success' : 'text-danger'}>
    {isValid ? '✓' : '✕'}
  </span>
);

const MiniAppUrlFactsTable = ({
  url,
  showManifestFacts,
  onFactsRead,
}: {
  url: string;
  showManifestFacts?: boolean;
  onFactsRead?: (facts: ApiDevToolsMiniAppUrlFacts) => void;
}) => {
  const { data: urlFacts } = useDevToolsInspectMiniAppUrl({
    url,
  });

  useEffect(() => {
    if (urlFacts && onFactsRead) {
      onFactsRead(urlFacts);
    }
  }, [urlFacts, onFactsRead]);

  const cacheAge = useMemo(() => {
    if (!urlFacts?.statusCode || urlFacts.statusCode > 400) {
      return '-';
    }

    return typeof urlFacts?.cacheAge === 'number'
      ? `max-age=${urlFacts.cacheAge}`
      : 'max-age=0';
  }, [urlFacts]);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium">URL Details</div>
      <div className="flex min-w-[422px] flex-col rounded-lg border border-faint">
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">HTTP Status</div>
          <div className="flex flex-1 items-center gap-3 p-3 text-sm font-medium">
            {typeof urlFacts?.statusCode === 'number' &&
            urlFacts?.statusCode !== 0 ? (
              <>
                <StatusIndicator isValid={urlFacts.statusCode === 200} />
                <span>{urlFacts.statusCode}</span>
              </>
            ) : (
              '-'
            )}
          </div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">Cache Header</div>
          <div className="flex-1 p-3 text-sm font-medium">{cacheAge}</div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">Embed Present</div>
          <div className="flex-1 p-3 text-sm font-medium">
            {typeof urlFacts?.miniAppEmbedPresent === 'boolean' ? (
              <StatusIndicator isValid={urlFacts.miniAppEmbedPresent} />
            ) : (
              '-'
            )}
          </div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">Embed Valid</div>
          <div className="flex-1 p-3 text-sm font-medium">
            {typeof urlFacts?.miniAppEmbedValid === 'boolean' ? (
              <StatusIndicator isValid={urlFacts.miniAppEmbedValid} />
            ) : (
              '-'
            )}
          </div>
        </div>
        {showManifestFacts && (
          <>
            <div className="flex border-b border-faint">
              <div className="w-1/3 p-3 text-sm bg-faint">Manifest Present</div>
              <div className="flex-1 p-3 text-sm font-medium">
                {typeof urlFacts?.miniAppManifestPresent === 'boolean' ? (
                  <StatusIndicator isValid={urlFacts.miniAppManifestPresent} />
                ) : (
                  '-'
                )}
              </div>
            </div>
            <div className="flex">
              <div className="w-1/3 p-3 text-sm bg-faint">Manifest Valid</div>
              <div className="flex-1 p-3 text-sm font-medium">
                {typeof urlFacts?.miniAppManifestValid === 'boolean' ? (
                  <StatusIndicator isValid={urlFacts.miniAppManifestValid} />
                ) : (
                  '-'
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { MiniAppUrlFactsTable };
