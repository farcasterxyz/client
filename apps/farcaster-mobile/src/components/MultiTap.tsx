import React, { FC, memo, ReactNode, useRef } from 'react';
import { TouchableOpacityProps } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

type MultiTapProps = TouchableOpacityProps & {
  children: ReactNode;
  onTap?: () => void;
  onDoubleTap: () => void;
  onLongPress?: () => void;
  maxWaitBeforeNextTap?: number;
};

const MultiTap: FC<MultiTapProps> = memo(
  ({
    children,
    onTap,
    onDoubleTap,
    onMagicTap,
    onLongPress,
    maxWaitBeforeNextTap = 500,
    style,
  }) => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const tapCountRef = useRef(0);

    return (
      <TouchableOpacity
        style={style}
        onMagicTap={onMagicTap}
        onLongPress={onLongPress}
        onPress={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          tapCountRef.current++;

          if (tapCountRef.current === 2 && onDoubleTap) {
            onDoubleTap();
          }

          timeoutRef.current = setTimeout(() => {
            if (tapCountRef.current === 1 && onTap) {
              onTap();
            }
            tapCountRef.current = 0;
          }, maxWaitBeforeNextTap);
        }}
      >
        {children}
      </TouchableOpacity>
    );
  },
);

MultiTap.displayName = 'MultiTap';

export { MultiTap };
