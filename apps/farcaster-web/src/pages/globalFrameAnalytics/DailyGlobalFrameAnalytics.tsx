import { ApiGlobalFrameAnalyticsByDay } from 'farcaster-client-data';

export function DailyGlobalFrameAnalytics({
  data,
}: {
  data: ApiGlobalFrameAnalyticsByDay[];
}) {
  return (
    <div>
      <div className="mb-3 text-lg font-bold">Last 30 days</div>
      <table className="w-full table-fixed border-x border-t border-default">
        <thead>
          <tr className="border-b border-default">
            <th className="border-r px-2 text-left border-default">Date</th>
            <th className="border-r px-2 text-right">fDAU</th>
            <th className="border-r px-2 text-right">Unique Mini Apps</th>
            <th className="px-2 text-right">Total actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ date, data: dateData }) => {
            return (
              <tr className="border-b border-default">
                <td className="border-r px-2 border-default">{date}</td>
                <td className="border-r px-2 text-right">{dateData.fdau}</td>
                <td className="border-r px-2 text-right">
                  {dateData.activeFrames}
                </td>
                <td className="px-2 text-right">{dateData.totalActions}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
