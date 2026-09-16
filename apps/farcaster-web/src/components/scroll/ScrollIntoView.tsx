import { FC, memo, ReactNode, useEffect, useRef } from 'react';

type ScrollIntoViewProps = {
  arg?: boolean | ScrollIntoViewOptions | undefined;
  children?: ReactNode;
};

const ScrollIntoView: FC<ScrollIntoViewProps> = memo(({ arg, children }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView(arg);
    }
  }, [arg]);

  return <div ref={ref}>{children}</div>;
});

ScrollIntoView.displayName = 'ScrollIntoView';

export { ScrollIntoView };
