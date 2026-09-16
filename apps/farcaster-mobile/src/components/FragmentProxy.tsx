import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type FragmentProxyProps = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

// After the React 19 upgrade, rendering a <> React.Fragment inside a
// TouchableHighlight prints an annoying runtime error because that component
// calls cloneElement on children and passes its props in to that cloned child.
// This results in React.Fragment getting a style prop, which React 19 doesn't
// like. Getting around this requires adding extra nodes to the view hierarchy,
// which is silly and affects perf for no good reason. Instead we're doing this
// hacky maneuver where we use FragmentProxy in place of React.Fragment when
// passed as children to TouchableHighlight.
function FragmentProxy({ children }: FragmentProxyProps) {
  return children;
}

export { FragmentProxy };
