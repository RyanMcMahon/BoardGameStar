import React from 'react';
import styled from 'styled-components';

import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { Link, Redirect, useParams } from 'react-router-dom';
import { useUser, logIn, signOut } from '../../utils/server';

export function GameProfile() {
  const params = useParams();

  return (
    <WebPage>
      <Content>[TODO game profile]</Content>
    </WebPage>
  );
}
