import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React from 'react';

import {
  contactsNextUploadCursorStorageKey,
  contactsStorageKey,
} from '~/constants/Storage';
import { deleteItem } from '~/utils/StorageUtils';

async function cleanContactsStore() {
  await deleteItem({ key: contactsStorageKey });
  await deleteItem({ key: contactsNextUploadCursorStorageKey });
}

export function ContactsLocalCacheBusterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'ContactsLocalCacheBusterProvider',
  });

  React.useEffect(() => {
    cleanContactsStore();
  }, []);

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'ContactsLocalCacheBusterProvider',
  });

  return <>{children}</>;
}
