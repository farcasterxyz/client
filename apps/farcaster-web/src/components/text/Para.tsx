import { FC, ReactNode } from 'react';

interface ParaProps {
  children: ReactNode;
}

const Para: FC<ParaProps> = ({ children }) => {
  return <p className="mb-3 text-default">{children}</p>;
};

Para.displayName = 'Para';

export { Para };
