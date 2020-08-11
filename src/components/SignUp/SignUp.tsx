import React from 'react';

import { Button } from '../../utils/style';
import { Redirect } from 'react-router-dom';
import { signUp, SignUpForm, useUser } from '../../utils/api';

export function SignUp() {
  const { currentUser } = useUser();
  const [form, setForm] = React.useState<SignUpForm>({
    email: '',
    password: '',
  });
  const handleSubmit = () => signUp(form);

  if (currentUser) {
    return <Redirect to="/games" />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <br />
        <input
          type="email"
          value={form.email}
          onChange={e => {
            const email = e.currentTarget.value;
            setForm(f => ({ ...f, email }));
          }}
        />
      </label>
      <label>
        Password
        <br />
        <input
          type="password"
          value={form.password}
          onChange={e => {
            const password = e.currentTarget.value;
            setForm(f => ({ ...f, password }));
          }}
        />
      </label>
      <Button design="primary" type="button" onClick={handleSubmit}>
        Sign Up
      </Button>
    </form>
  );
}
