import { FC, FormHTMLAttributes, memo } from 'react';

type FormProps = FormHTMLAttributes<HTMLFormElement>;

const Form: FC<FormProps> = memo((props) => {
  return <form {...props}></form>;
});

Form.displayName = 'Form';

export { Form };
