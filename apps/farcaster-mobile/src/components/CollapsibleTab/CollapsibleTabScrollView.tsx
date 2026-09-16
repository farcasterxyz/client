import { ScrollView } from 'react-native';
import { Tabs } from 'react-native-collapsible-tab-view';

const CollapsibleTabsScrollView =
  Tabs.ScrollView as unknown as typeof ScrollView;

export { CollapsibleTabsScrollView };
