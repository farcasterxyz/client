import { ApiHttpResponse } from 'farcaster-client-data';

const StatusIndicator = ({ isValid }: { isValid: boolean }) => (
  <span className={isValid ? 'text-success' : 'text-danger'}>
    {isValid ? '✓' : '✕'}
  </span>
);

export function HttpResponseTable({ response }: { response: ApiHttpResponse }) {
  const body = (() => {
    if (typeof response.body === 'string') {
      return response.body;
    }

    if (typeof response.body === 'object' && response.body !== null) {
      return JSON.stringify(response.body, null, 2);
    }
  })();

  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium">URL Details</div>
      <div className="flex min-w-[422px] flex-col rounded-lg border border-faint">
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">URL</div>
          <div className="flex flex-1 items-center gap-3 p-3 text-sm font-medium">
            {response.url}
          </div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">HTTP Status</div>
          <div className="flex flex-1 items-center gap-3 p-3 text-sm font-medium">
            <>
              <StatusIndicator isValid={response.status === 200} />
              <span>{response.status}</span>
            </>
          </div>
        </div>
        <div className="flex border-b border-faint">
          <div className="w-1/3 p-3 text-sm bg-faint">Body</div>
          <div className="max-h-24 flex-1 overflow-auto whitespace-pre p-3 text-sm font-medium">
            {body}
          </div>
        </div>
        {response.headerCacheControl && (
          <div className="flex border-b border-faint">
            <div className="w-1/3 p-3 text-sm bg-faint">Cache Header</div>
            <div className="flex-1 p-3 text-sm font-medium">
              {response.headerCacheControl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
