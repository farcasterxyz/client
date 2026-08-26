import cn from 'classnames';
import { FC, memo, useMemo } from 'react';

import { mdAvatarDiameter } from '~/constants/avatar';
import { ThreadPosition } from '~/types';

type ThreadlineProps = {
  threadPosition: ThreadPosition;
};

// These hard-coded values are directly linked to cast padding
// sizes. Any changes on cast padding - will break these.
const SEGMENT_LEFT_OFFSET = 14 + Math.round(mdAvatarDiameter / 2);
const TOP_SEGMENT_HEIGHT = Math.round(mdAvatarDiameter / 2) + 4; // + 4 is in case we have a top hat

const Threadline: FC<ThreadlineProps> = memo(({ threadPosition }) => {
  const {
    segmentLeftOffset,
    topSegmentHeight,
    bottomSegmentBorderClassName,
    topSegmentBorderClassName,
    attachAngledConnector,
  } = useMemo((): {
    segmentLeftOffset: number;
    topSegmentHeight: number | string;
    bottomSegmentBorderClassName: string;
    topSegmentBorderClassName: string;
    attachAngledConnector: boolean;
  } => {
    switch (threadPosition) {
      case 'start':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-none',
          bottomSegmentBorderClassName: 'border-solid',
          attachAngledConnector: false,
        };
      case 'start_and_end':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-none',
          bottomSegmentBorderClassName: 'border-none',
          attachAngledConnector: false,
        };
      case 'composer_start':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET - 16,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-none',
          bottomSegmentBorderClassName: 'border-solid',
          attachAngledConnector: false,
        };
      case 'end_continuous':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-solid',
          bottomSegmentBorderClassName: 'border-none',
          attachAngledConnector: false,
        };
      case 'end_disconnected':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-solid',
          bottomSegmentBorderClassName: 'border-none',
          attachAngledConnector: false,
        };
      case 'middle_continuous':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-solid',
          bottomSegmentBorderClassName: 'border-solid',
          attachAngledConnector: false,
        };
      case 'middle_disconnected':
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          // This is only used by Show More which is vertically short
          // so the normal height calculations result in overflow into the
          // next cast. Use full height instead
          topSegmentHeight: '100%',
          topSegmentBorderClassName: 'border-dotted',
          bottomSegmentBorderClassName: 'border-none',
          attachAngledConnector: false,
        };
      default:
        return {
          segmentLeftOffset: SEGMENT_LEFT_OFFSET,
          topSegmentHeight: TOP_SEGMENT_HEIGHT,
          topSegmentBorderClassName: 'border-none',
          bottomSegmentBorderClassName: 'border-none',
          attachAngledConnector: false,
        };
    }
  }, [threadPosition]);

  return (
    <>
      {attachAngledConnector && (
        <div
          className={cn(
            'absolute border-tertiary',
            'h-[47.5px] w-12 rounded-lg border-b-2 border-l-2 border-solid !border-l-transparent',
          )}
          style={{
            left: SEGMENT_LEFT_OFFSET - 2,
            top: -topSegmentHeight - 1,
          }}
        ></div>
      )}
      <div
        className={cn(
          'absolute top-0 w-[1px] border-l-2 border-tertiary',
          topSegmentBorderClassName,
        )}
        style={{
          left: segmentLeftOffset,
          height: topSegmentHeight,
        }}
      ></div>
      <div
        className={cn(
          'absolute bottom-0 w-[1px] border-l-2 border-tertiary',
          bottomSegmentBorderClassName,
        )}
        style={{
          left: segmentLeftOffset,
          top: topSegmentHeight,
        }}
      ></div>
    </>
  );
});

Threadline.displayName = 'Threadline';

export { Threadline };
