import { configureReanimatedLogger } from 'react-native-reanimated';

const initLogBox = () => {
  // React Native Web does not expose LogBox at the native React Native path.
};

configureReanimatedLogger({
  strict: false,
});

export { initLogBox };
