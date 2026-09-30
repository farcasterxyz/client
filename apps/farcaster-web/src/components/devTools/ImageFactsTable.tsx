import { useDevToolsInspectImageUrl } from 'farcaster-client-hooks';

const ImageFactsTable = ({ imageUrl }: { imageUrl: string }) => {
  const { data: imageFacts } = useDevToolsInspectImageUrl({
    url: imageUrl,
  });

  const formatImageSize = (bytes?: number) => {
    if (!bytes) {
      return '-';
    }
    return `${Math.round(bytes / 1024)}kb`;
  };

  const formatLoadTime = (ms?: number) => {
    if (!ms) {
      return '-';
    }
    return `${ms}ms`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium text-muted">Image Details</div>
      <div className="flex min-w-[422px] flex-col rounded-lg border border-faint">
        <div className="flex border-b border-faint">
          <div className="w-1/2 p-3 text-sm bg-faint">HTTP Status</div>
          <div className="flex-1 p-3 text-right text-sm font-medium">
            <span
              className={
                imageFacts?.statusCode === 200 ? 'text-success' : 'text-danger'
              }
            >
              {imageFacts?.statusCode || '-'}
            </span>
          </div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/2 p-3 text-sm bg-faint">Cache Header</div>
          <div className="flex-1 p-3 text-right text-sm font-medium">
            {imageFacts?.cacheAge
              ? `max-age=${imageFacts?.cacheAge}`
              : 'max-age=0'}
          </div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/2 p-3 text-sm bg-faint">Load time</div>
          <div className="flex-1 p-3 text-right text-sm font-medium">
            {imageFacts?.imageLoadTimeMs
              ? formatLoadTime(imageFacts?.imageLoadTimeMs)
              : '-'}
          </div>
        </div>
        <div className="flex">
          <div className="w-1/2 p-3 text-sm bg-faint">Image size</div>
          <div className="flex-1 p-3 text-right text-sm font-medium">
            <span
              className={
                imageFacts?.imageSizeBytes &&
                imageFacts?.imageSizeBytes > 512000
                  ? 'text-danger'
                  : ''
              }
            >
              {imageFacts?.imageSizeBytes
                ? formatImageSize(imageFacts?.imageSizeBytes)
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ImageFactsTable };
