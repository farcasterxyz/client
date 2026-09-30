import { FC } from 'react';

import {
  LinkToProfileCasts,
  LinkToProfileCastsProps,
} from '~/components/links/LinkToProfileCasts';

type LinkToProfileProps = LinkToProfileCastsProps;

const LinkToProfile: FC<LinkToProfileProps> = LinkToProfileCasts;

export { LinkToProfile };
