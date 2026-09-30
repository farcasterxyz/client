import { ApiAdminFeedOrdering } from 'farcaster-client-data';
import { useDebouncedValue } from 'farcaster-client-hooks';
import { FC, memo, ReactNode, useEffect, useState } from 'react';

import { SelectInput } from '~/components/forms/SelectInput';
import { TextInput } from '~/components/forms/TextInput';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

interface AdminFeedConfig {
  type?: string;
  fid?: number;
  minScoreForMediumDistChannels?: number;
  mutedKeywords?: string;
  ordering?: ApiAdminFeedOrdering;
  updateTimestamp: number;
  demoteViewedCasts?: boolean;
  spreadOutAuthors?: number;
  includeReplies?: boolean;
  includeTrendingCasts?: boolean;
  recastsNumRequired?: number;
  followerLikedCastsMinLikes?: number;
  includeHasReplyByFollowed?: boolean;
  hasReplyByFollowedMinTotalRepliesEngagement?: number;
  exploreCoefficient?: number;
  bundleMiniApps?: boolean;
}

interface AdminFeedConfigPanelProps {
  onConfigChange: (config: AdminFeedConfig) => void;
  refetch: (() => void) | undefined;
  isLoading: boolean;
}

const AdminFeedConfigPanel: FC<AdminFeedConfigPanelProps> = memo(
  ({ onConfigChange, refetch, isLoading }) => {
    const { fid: currentUserFid } = useCurrentUser();

    const [feedType, setFeedType] = useState('home');
    const debouncedFeedType = useDebouncedValue({ value: feedType });

    const [fid, setFid] = useState<number | undefined>();
    const debouncedFid = useDebouncedValue({ value: fid || currentUserFid });

    const [ordering, setOrdering] = useState<ApiAdminFeedOrdering | undefined>(
      undefined,
    );

    const [mutedKeywords, setMutedKeywords] = useState<string | undefined>(
      undefined,
    );
    const [demoteViewedCasts, setDemoteViewedCasts] = useState<boolean>(true);
    const [spreadOutAuthors, setSpreadOutAuthors] = useState<
      number | undefined
    >(undefined);
    const [includeReplies, setIncludeReplies] = useState<boolean | undefined>(
      undefined,
    );
    const [includeTrendingCasts, setIncludeTrendingCasts] = useState<
      boolean | undefined
    >(undefined);

    const [recastsNumRequired, setRecastsNumRequired] = useState<
      number | undefined
    >(undefined);

    const [followerLikedCastsMinLikes, setFollowerLikedCastsMinLikes] =
      useState<number | undefined>(undefined);

    const [usingProdFeed, setUsingProdFeed] = useState(false);

    const [includeHasReplyByFollowed, setIncludeHasReplyByFollowed] = useState<
      boolean | undefined
    >(undefined);

    const [exploreCoefficient, setExploreCoefficient] = useState<
      number | undefined
    >(undefined);

    const [
      hasReplyByFollowedMinTotalRepliesEngagement,
      setHasReplyByFollowedMinTotalRepliesEngagements,
    ] = useState<number | undefined>(undefined);

    const [dropAuthorSpacing, setDropAuthorSpacing] = useState<
      boolean | undefined
    >(undefined);

    const [bundleMiniApps, setBundleMiniApps] = useState<boolean | undefined>(
      undefined,
    );

    useEffect(() => {
      onConfigChange(
        !usingProdFeed
          ? {
              type: debouncedFeedType,
              fid: debouncedFid,
              ordering,
              updateTimestamp: Date.now(),
              mutedKeywords,
              demoteViewedCasts,
              spreadOutAuthors,
              includeReplies,
              includeTrendingCasts,
              recastsNumRequired,
              followerLikedCastsMinLikes,
              includeHasReplyByFollowed,
              hasReplyByFollowedMinTotalRepliesEngagement,
              exploreCoefficient: exploreCoefficient
                ? exploreCoefficient
                : undefined,
              bundleMiniApps,
            }
          : {
              fid: debouncedFid,
              type: debouncedFeedType,
              updateTimestamp: Date.now(),
            },
      );
    }, [
      debouncedFeedType,
      debouncedFid,
      onConfigChange,
      ordering,
      mutedKeywords,
      demoteViewedCasts,
      spreadOutAuthors,
      includeReplies,
      includeTrendingCasts,
      recastsNumRequired,
      followerLikedCastsMinLikes,
      usingProdFeed,
      includeHasReplyByFollowed,
      hasReplyByFollowedMinTotalRepliesEngagement,
      exploreCoefficient,
      bundleMiniApps,
    ]);

    return (
      <div className="flex flex-row flex-wrap items-center gap-3 border-b p-2 text-sm border-default">
        <AdminFeedConfigSetting>
          <span>Feed:</span>
          <span className="w-32">
            <TextInput
              value={feedType}
              style={{ padding: '2px 6px' }}
              onChange={(e) => {
                setFeedType(e.target.value);
              }}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>FID:</span>
          <span className="w-32">
            <TextInput
              value={fid}
              style={{ padding: '2px 6px' }}
              pattern="[0-9]*"
              placeholder={`You (${currentUserFid.toString()})`}
              onChange={(e) => {
                setFid((v) => {
                  if (e.target.value === '') {
                    return undefined;
                  } else {
                    return e.target.validity.valid
                      ? parseInt(e.target.value)
                      : v;
                  }
                });
              }}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Use prod feed</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'No', value: 'false' },
                { name: 'Yes', value: 'true' },
              ]}
              value={usingProdFeed.toString()}
              onChange={(e) => {
                setUsingProdFeed(e.target.value === 'true');
              }}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Ordering</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Default', value: 'default' },
                { name: 'Affinity', value: 'affinity' },
                { name: 'ML', value: 'ml' },
                { name: 'ML (test model)', value: 'ml-test' },
                { name: 'Chrono', value: 'chrono' },
                { name: 'New model (10-28-2024)', value: '10-28-2024' },
              ]}
              value={ordering === undefined ? 'default' : ordering.toString()}
              onChange={(e) => {
                setOrdering(
                  e.target.value === 'default'
                    ? undefined
                    : (e.target.value as ApiAdminFeedOrdering),
                );
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Demote viewed casts</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Yes', value: 'true' },
                { name: 'No', value: 'false' },
              ]}
              value={demoteViewedCasts.toString()}
              onChange={(e) => {
                setDemoteViewedCasts(e.target.value === 'true');
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Spread out authors</span>
          <span className="w-32">
            <TextInput
              value={spreadOutAuthors}
              style={{ padding: '2px 6px' }}
              pattern="[0-9]*"
              placeholder={`10`}
              onChange={(e) => {
                setSpreadOutAuthors((v) => {
                  if (e.target.value === '') {
                    return undefined;
                  } else {
                    return e.target.validity.valid
                      ? parseInt(e.target.value)
                      : v;
                  }
                });
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Include replies</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Default', value: 'default' },
                { name: 'Yes', value: 'true' },
                { name: 'No', value: 'false' },
              ]}
              value={
                includeReplies === undefined
                  ? 'default'
                  : includeReplies.toString()
              }
              onChange={(e) => {
                setIncludeReplies(
                  e.target.value === 'default'
                    ? undefined
                    : e.target.value === 'true',
                );
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Include trending</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Default', value: 'default' },
                { name: 'Yes', value: 'true' },
                { name: 'No', value: 'false' },
              ]}
              value={
                includeTrendingCasts === undefined
                  ? 'default'
                  : includeTrendingCasts.toString()
              }
              onChange={(e) => {
                setIncludeTrendingCasts(
                  e.target.value === 'default'
                    ? undefined
                    : e.target.value === 'true',
                );
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Num. recasts required</span>
          <span className="w-32">
            <TextInput
              value={recastsNumRequired}
              style={{ padding: '2px 6px' }}
              pattern="[0-9]*"
              placeholder={`5`}
              onChange={(e) => {
                setRecastsNumRequired((v) => {
                  if (e.target.value === '') {
                    return undefined;
                  } else {
                    return e.target.validity.valid
                      ? parseInt(e.target.value)
                      : v;
                  }
                });
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Min likes by followed</span>
          <span className="w-32">
            <TextInput
              value={followerLikedCastsMinLikes}
              style={{ padding: '2px 6px' }}
              pattern="[0-9]*"
              placeholder={`5`}
              onChange={(e) => {
                setFollowerLikedCastsMinLikes((v) => {
                  if (e.target.value === '') {
                    return undefined;
                  } else {
                    return e.target.validity.valid
                      ? parseInt(e.target.value)
                      : v;
                  }
                });
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Include has reply by followed</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Default', value: 'default' },
                { name: 'Yes', value: 'true' },
                { name: 'No', value: 'false' },
              ]}
              value={
                includeHasReplyByFollowed === undefined
                  ? 'default'
                  : includeHasReplyByFollowed.toString()
              }
              onChange={(e) => {
                setIncludeHasReplyByFollowed(
                  e.target.value === 'default'
                    ? undefined
                    : e.target.value === 'true',
                );
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Min total eng on replied by followed</span>
          <span className="w-32">
            <TextInput
              value={hasReplyByFollowedMinTotalRepliesEngagement}
              style={{ padding: '2px 6px' }}
              pattern="[0-9]*"
              placeholder="5"
              onChange={(e) => {
                setHasReplyByFollowedMinTotalRepliesEngagements((v) => {
                  if (e.target.value === '') {
                    return undefined;
                  } else {
                    return e.target.validity.valid
                      ? parseInt(e.target.value)
                      : v;
                  }
                });
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Exploration coefficient</span>
          <span className="w-32">
            <TextInput
              value={exploreCoefficient}
              type={'number'}
              step="0.05"
              max="1"
              min="0"
              style={{ padding: '2px 6px' }}
              placeholder="0"
              onChange={(e) => {
                setExploreCoefficient((v) => {
                  if (e.target.value === '') {
                    return undefined;
                  } else {
                    return e.target.validity.valid ? Number(e.target.value) : v;
                  }
                });
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Muted Keywords</span>
          <span className="w-32">
            <TextInput
              value={mutedKeywords}
              style={{ padding: '2px 6px' }}
              placeholder={`tropical house`}
              onChange={(e) => {
                setMutedKeywords(
                  e.target.value === '' ? undefined : e.target.value,
                );
              }}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Drop author spacing</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Yes', value: 'true' },
                { name: 'No', value: 'false' },
              ]}
              value={
                dropAuthorSpacing === undefined
                  ? 'false'
                  : dropAuthorSpacing.toString()
              }
              onChange={(e) => {
                setDropAuthorSpacing(
                  e.target.value === 'default'
                    ? undefined
                    : e.target.value === 'true',
                );
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          <span>Bundle mini apps</span>
          <span className="">
            <SelectInput
              className="w-24 rounded border bg-input px-1 py-[2px] text-sm text-muted border-default"
              choices={[
                { name: 'Yes', value: 'true' },
                { name: 'No', value: 'false' },
              ]}
              value={
                bundleMiniApps === undefined
                  ? 'false'
                  : bundleMiniApps.toString()
              }
              onChange={(e) => {
                setBundleMiniApps(
                  e.target.value === 'default'
                    ? undefined
                    : e.target.value === 'true',
                );
              }}
              disabled={usingProdFeed}
            />
          </span>
        </AdminFeedConfigSetting>
        <AdminFeedConfigSetting>
          {isLoading && <LoadingIndicator />}
          {!isLoading && refetch && (
            <span
              onClick={refetch}
              className="text-link hover:cursor-pointer hover:underline"
            >
              Refresh
            </span>
          )}
        </AdminFeedConfigSetting>
      </div>
    );
  },
);

AdminFeedConfigPanel.displayName = 'AdminFeedConfigPanel';

interface AdminFeedConfigSettingProps {
  children: ReactNode;
}

const AdminFeedConfigSetting: FC<AdminFeedConfigSettingProps> = memo(
  ({ children }) => {
    return <div className="flex flex-row items-center gap-2">{children}</div>;
  },
);

export { type AdminFeedConfig, AdminFeedConfigPanel };
