import { ApiGenericNotificationGroup } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { buildGenericContent } from './Generic/buildGenericContent';
import { resolveRenderer } from './Generic/registry';

type GenericNotificationGroupProps = {
  group: ApiGenericNotificationGroup;
};

const GenericNotificationGroup: FC<GenericNotificationGroupProps> = memo(
  ({ group }) => {
    const item = group.previewItems[0];
    const content = buildGenericContent(item);
    const renderer = resolveRenderer(item);
    return renderer({ group, item, content });
  },
);

GenericNotificationGroup.displayName = 'GenericNotificationGroup';

export { GenericNotificationGroup };
