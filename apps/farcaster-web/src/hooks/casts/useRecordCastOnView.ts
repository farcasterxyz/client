import { TrackCastViewFn, useTrackEvent } from 'farcaster-client-hooks';
import { useRef } from 'react';
import { useInView } from 'react-intersection-observer';

export const CAST_MIN_VIEW_TIME = 500;

export function useRecordCastOnView(
  castViewData: Parameters<TrackCastViewFn>[0],
) {
  const { trackCastView } = useTrackEvent();
  const isVisible = useRef<boolean>(false);
  const { ref: inViewRef } = useInView({
    // Not 1 because there seems to be interaction with borders where the top feed
    // top cast may not be reported
    // Temp setting to 0.35 while we figure out what to do with the large whitespace casts
    threshold: 0.35,
    // We don't use delay because it only applies after initial load, see
    // https://github.com/thebuilder/react-intersection-observer/issues/591
    // On initial load the callback is always called with inView = true and it's impossible
    // to determine this. So instead we handle the delay ourselves by setting visibility
    // flag, setting a timer and emitting a view only if the element is still visible
    onChange: (inView) => {
      isVisible.current = inView;
      if (inView) {
        setTimeout(() => {
          if (isVisible.current) {
            trackCastView(castViewData);
          }
        }, CAST_MIN_VIEW_TIME);
      }
    },
  });

  return { inViewRef };
}
