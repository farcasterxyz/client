import isNumber from 'lodash/isNumber';
import React from 'react';
import { ColorValue } from 'react-native';
import { Path, Svg } from 'react-native-svg';

type WarpProps = {
  fill: ColorValue;
  size?: 'default' | 'small' | 'md' | 'base' | number;
};

const Warp: React.FC<WarpProps> = ({ fill, size = 'default' }) => {
  const [width, height, viewBox] = React.useMemo(() => {
    // Bounding box determined with https://codepen.io/netsi1964/full/vNoemp/
    if (isNumber(size)) {
      return [size, size, '0 0 28 28'];
    }

    switch (size) {
      case 'small':
        return [9, 9, '0 0 28 28'];
      case 'base':
        return [14, 14, '0 0 30 30'];
      case 'md':
        return [16, 16, '0 0 28 28'];
      case 'default':
      default:
        return [19, 19, '0 0 28 28'];
    }
  }, [size]);

  return (
    <Svg width={width} height={height} viewBox={viewBox} fill="none">
      <Path
        fill={fill}
        fillRule="evenodd"
        d="M14.804.333a1.137 1.137 0 0 0-1.608 0L.333 13.196a1.137 1.137 0 0 0 0 1.608l12.863 12.863a1.137 1.137 0 0 0 1.608 0l12.863-12.863a1.137 1.137 0 0 0 0-1.608L14.804.333ZM14 5.159c0-.89-1.077-1.337-1.707-.707l-8.134 8.134a2 2 0 0 0 0 2.828l8.134 8.134c.63.63 1.707.184 1.707-.707V5.159Z"
        clipRule="nonzero"
      />
    </Svg>
  );
};

Warp.displayName = 'Warp';

export { Warp };
