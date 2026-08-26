import { FC, ReactNode } from 'react';

interface H2Props {
  children: ReactNode;
}

const H3: FC<H2Props> = ({ children }) => {
  return <h3 className="my-4 font-bold text-default">{children}</h3>;
};

H3.displayName = 'H3';

export { H3 };
