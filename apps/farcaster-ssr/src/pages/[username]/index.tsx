import { ApiCast, ApiPrimaryAddress, ApiUser } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { OGHead } from '~/components/meta/OGHead';
import { AddressList } from '~/components/profiles/AddressList';
import { ProfileCastItem } from '~/components/profiles/casts/ProfileCasts';
import { ProfileHeader } from '~/components/profiles/ProfileHeader';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';
import { getHost } from '~/utils/requestUtils';

type ProfileCastsParams = {
  username: string;
};

type ProfileCastsProps = {
  recentCasts: ApiCast[];
  topCasts: ApiCast[];
  host: string | undefined;
  user: ApiUser;
  addresses: ApiPrimaryAddress[];
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ProfileCastsParams>,
): Promise<GetServerSidePropsResult<ProfileCastsProps>> {
  const host = getHost(context);
  const username = context.params?.username || '';

  try {
    const user = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getUserByUsernameForOG({
        username,
        scope: 'pages.username',
        userAgent: context.req.headers['user-agent'],
      });
      return result;
    });

    const [recentCasts, topCasts, addresses] = await Promise.all([
      fetchAndHandleError(async () => {
        const {
          data: {
            result: { casts },
          },
        } = await apiClient.getUserCasts({ fid: user.fid, limit: 3 });
        return casts;
      }).catch(() => [] as ApiCast[]),

      fetchAndHandleError(async () => {
        const {
          data: { result },
        } = await apiClient.getUserTopCasts({
          fid: user.fid,
          scope: 'pages.username',
          userAgent: context.req.headers['user-agent'],
        });
        return result;
      }).catch(() => [] as ApiCast[]),

      fetchAndHandleError(async () => {
        const {
          data: { result },
        } = await apiClient.getUserConnectedAddresses({
          fid: user.fid,
          scope: 'pages.username',
          userAgent: context.req.headers['user-agent'],
        });
        return result;
      }).catch(() => [] as ApiPrimaryAddress[]),
    ]);

    return {
      props: { recentCasts, topCasts, host, user, addresses },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ProfileCastsPage({
  recentCasts,
  topCasts,
  user,
  addresses,
  host,
}: ProfileCastsProps) {
  return (
    <>
      <OGHead
        description={
          user.profile.bio.text
            ? `${user.profile.bio.text} — Follow @${user.username} on Farcaster to see their casts and join the conversation.`
            : `Follow @${user.username} on Farcaster to see their casts and join the conversation.`
        }
        imageUrl={user.pfp?.url}
        title={`${user.displayName} (@${user.username}) on Farcaster`}
        type="website"
        url={`https://farcaster.xyz/${user.username}`}
      />
      <div>
        <ProfileHeader user={user} />
        <section aria-labelledby="recent-casts">
          <h2 id="recent-casts">Recent casts</h2>
          <article>
            <div>
              {recentCasts.map((cast) => (
                <ProfileCastItem key={cast.hash} cast={cast} host={host} />
              ))}
            </div>
          </article>
        </section>
        <section aria-labelledby="top-casts">
          <h2 id="top-casts">Top casts</h2>
          <article>
            <div>
              {topCasts.map((cast) => (
                <ProfileCastItem key={cast.hash} cast={cast} host={host} />
              ))}
            </div>
          </article>
        </section>
        <section aria-labelledby="onchain-profile">
          <h2 id="onchain-profile">Onchain profile</h2>

          <h3>Ethereum addresses</h3>
          <article>
            <AddressList
              addresses={addresses.filter(
                (address) => address.protocol === 'ethereum',
              )}
            />

            <h3>Solana addresses</h3>
            <AddressList
              addresses={addresses.filter(
                (address) => address.protocol === 'solana',
              )}
            />
          </article>
        </section>
      </div>
    </>
  );
}
