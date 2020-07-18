import React from 'react';
import styled from 'styled-components';

import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { Link, Redirect } from 'react-router-dom';
import {
  signUp,
  SignUpForm,
  getCurrentUser,
  useUser,
} from '../../utils/server';

export function SignUp() {
  const { currentUser } = useUser();
  const [form, setForm] = React.useState<SignUpForm>({
    // displayName: '',
    email: '',
    password: '',
  });
  const handleSubmit = () => signUp(form);

  if (currentUser) {
    return <Redirect to="/games" />;
  }

  return (
    <WebPage>
      <Content>
        <form onSubmit={handleSubmit}>
          {/* <input
            type="text"
            value={form.displayName}
            onChange={e => {
              const displayName = e.currentTarget.value;
              setForm(f => ({ ...f, displayName }));
            }}
          /> */}
          <label>
            Email
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
      </Content>
    </WebPage>
  );
}
