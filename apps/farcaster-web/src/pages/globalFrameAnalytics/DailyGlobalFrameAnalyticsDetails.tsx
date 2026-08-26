import { ApiGlobalFrameAnalyticsByDay } from 'farcaster-client-data';

export function DailyGlobalFrameAnalyticsDetails({
  data,
}: {
  data: ApiGlobalFrameAnalyticsByDay[];
}) {
  return (
    <div>
      {data.map(({ date, data: dateData }) => {
        return (
          <div key={date}>
            <div className="mt-3 border-t py-3 text-lg font-bold border-faint">
              {date}
            </div>
            <div className="mb-3 text-md font-bold">Top Mini App Hosts</div>
            <table className="w-full table-fixed border-x border-t border-default">
              <thead>
                <tr className="border-b border-default">
                  <th className="border-defaul border-r px-2 text-left">
                    Mini App Hosts
                  </th>
                  <th className="w-20 border-r px-2 text-right">Uniques</th>
                  <th className="w-20 border-r px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dateData.hosts.map((hostData) => {
                  return (
                    <tr
                      className="border-b border-default"
                      key={hostData.frameHost}
                    >
                      <td className="w-32 truncate border-r px-2 border-default">
                        {hostData.frameHost}
                      </td>
                      <td className="border-r px-2 text-right">
                        {hostData.uniques}
                      </td>
                      <td className="border-r px-2 text-right">
                        {hostData.actions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mb-3 mt-5 text-md font-bold">Top Mini App URLs</div>
            <table className="w-full table-fixed border-x border-t border-default">
              <thead>
                <tr className="border-b border-default">
                  <th className="border-defaul border-r px-2 text-left">
                    Mini App URL
                  </th>
                  <th className="w-20 border-r px-2 text-right">Uniques</th>
                  <th className="w-20 border-r px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {dateData.frames.map((frameData) => {
                  return (
                    <tr
                      className="border-b border-default"
                      key={frameData.frameUrl}
                    >
                      <td className="w-32 truncate border-r px-2 border-default">
                        {frameData.frameUrl}
                      </td>
                      <td className="border-r px-2 text-right">
                        {frameData.uniques}
                      </td>
                      <td className="border-r px-2 text-right">
                        {frameData.actions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
