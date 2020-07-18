import React from 'react';
import styled from 'styled-components';

import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { Link, Redirect } from 'react-router-dom';
import { signUp, getCurrentUser, useUser } from '../../utils/server';

export function GamesMenu() {
  return (
    <div>
      <Link to="/games">My Games</Link>
      <Link to="/games/store">Store</Link>
    </div>
  );
}
