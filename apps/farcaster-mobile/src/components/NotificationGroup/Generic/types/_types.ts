import { ApiGenericNotificationGroup } from 'farcaster-client-data';
import { ReactElement } from 'react';

import { GenericContent } from '~/components/NotificationGroup/Generic/buildGenericContent';

export type NotificationRendererProps = {
  group: ApiGenericNotificationGroup;
  item: ApiGenericNotificationGroup['previewItems'][0];
  content: GenericContent;
};

export type NotificationRenderer = (
  props: NotificationRendererProps,
) => ReactElement | null;
