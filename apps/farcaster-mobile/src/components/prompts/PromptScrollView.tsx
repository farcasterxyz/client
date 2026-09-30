// You might be wondering why we are using this specific ScrollView for prompts
// instead of using something from BottomSheet or React Native core engine directly.
// Android has event handler issues requiring gesture-handler ScrollView to be used.
// See more details:
// https://ui.gorhom.dev/components/bottom-sheet/troubleshooting/#adding-horizontal-flatlist-or-scrollview-is-not-working-properly-on-android
import { ScrollView } from 'react-native-gesture-handler';
export { ScrollView as PromptScrollView };
