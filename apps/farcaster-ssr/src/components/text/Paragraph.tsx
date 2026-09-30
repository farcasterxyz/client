import { FC, ReactNode } from 'react';

interface ParaProps {
  children: ReactNode;
}

const Para: FC<ParaProps> = ({ children }) => {
  return <p>{children}</p>;
};

Para.displayName = 'Para';

export { Para as H1, Para as H2, Para as H3, Para };
