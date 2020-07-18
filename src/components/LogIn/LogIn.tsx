import React from 'react';
import styled from 'styled-components';

import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { Link, Redirect } from 'react-router-dom';
import { useUser, logIn } from '../../utils/server';

interface SignUpForm {
  email: string;
  password: string;
}

export function LogIn() {
  const { currentUser } = useUser();
  const [form, setForm] = React.useState<SignUpForm>({
    email: '',
    password: '',
  });
  const handleSubmit = () => logIn(form.email, form.password);

  if (currentUser) {
    return <Redirect to="/games" />;
  }

  return (
    <WebPage>
      <Content>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={form.email}
            onChange={e => {
              const email = e.currentTarget.value;
              setForm(f => ({ ...f, email }));
            }}
          />
          <input
            type="password"
            value={form.password}
            onChange={e => {
              const password = e.currentTarget.value;
              setForm(f => ({ ...f, password }));
            }}
          />
          <Button design="primary" type="button" onClick={handleSubmit}>
            Log In
          </Button>
        </form>
      </Content>
    </WebPage>
  );
}
