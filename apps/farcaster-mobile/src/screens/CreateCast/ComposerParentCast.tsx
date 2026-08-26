import { useThread } from 'farcaster-client-hooks';
import React from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { Text } from '~/components/Text';
import { createCastAvatarDiameter } from '~/constants/Cast';
import { useComposer } from '~/contexts/ComposerParentCastProvider';
import { useTheme } from '~/contexts/ThemeProvider';

type ComposerParentCastProps = {
  parentCastHash: string | undefined;
  onLayout: (event: LayoutChangeEvent) => void;
};

const ComposerParentCast: React.FC<ComposerParentCastProps> = React.memo(
  ({ parentCastHash, onLayout }) => {
    const { onParentCastLoad } = useComposer();
    React.useEffect(() => {
      // useThread requires a parentCastHash, so we need to call it inside
      // ComposerParentCastContent below, where we are guaranteed to have a
      // parentCastHash. However, we need to be able to call
      // onParentCastLoad(undefined) to clear the parent cast when it is removed
      // from the intent. That needs to happen here, since we need to make sure
      // ComposerParentCastContent isn't rendered in that case.
      if (!parentCastHash) {
        onParentCastLoad({ parentCast: undefined });
      }
    }, [parentCastHash, onParentCastLoad]);
    if (!parentCastHash) {
      return null;
    }
    return (
      <React.Suspense>
        <ComposerParentCastContent
          parentCastHash={parentCastHash}
          onLayout={onLayout}
        />
      </React.Suspense>
    );
  },
);

type ComposerParentCastContentProps = {
  parentCastHash: string;
  onLayout: (event: LayoutChangeEvent) => void;
};

const ComposerParentCastContent: React.FC<ComposerParentCastContentProps> =
  React.memo(({ parentCastHash, onLayout }) => {
    const t = useTheme();

    const { onParentCastLoad } = useComposer();

    const { data } = useThread({ castHash: parentCastHash });

    const parentCast = React.useMemo(() => {
      return data!.pages
        .flatMap((page) => page.result.casts)
        .find((cast) => cast.hash === parentCastHash);
    }, [data, parentCastHash]);

    React.useEffect(() => {
      if (typeof parentCast !== 'undefined') {
        onParentCastLoad({ parentCast });
      }
    }, [onParentCastLoad, parentCast]);

    if (typeof parentCast === 'undefined') {
      return (
        <View
          style={[
            t.pX4,
            t.pY2,
            t.rounded,
            t.borderDefault,
            t.borderHairline,
            t.mY1,
          ]}
        >
          <Text style={[t.texts.secondary]}>Failed to find cast</Text>
        </View>
      );
    }

    if (parentCast.deleted) {
      return (
        <View style={[t.pY3, t.borderBHairline, t.borderDefault]}>
          <Text style={[t.textBase, t.texts.secondary]}>
            This cast has been deleted
          </Text>
        </View>
      );
    }

    return (
      <View style={[t._mX4]} onLayout={onLayout}>
        <Cast
          cast={parentCast}
          threadPosition="create_cast_inline_replying_to"
          hideActions={true}
          omitMenuActions={true}
          avatarDiameter={createCastAvatarDiameter}
          skipShowMoreCTA={true}
        />
      </View>
    );
  });

export { ComposerParentCast };
