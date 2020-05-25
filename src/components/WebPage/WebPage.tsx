import React from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';

import {
  primaryColor,
  primaryHighlightColor,
  breakPoints,
  Button,
  theShadow,
} from '../../utils/style';
import { isWebBuild } from '../../utils/meta';
import { imagePrefix } from '../../utils/assets';

interface Props {
  children: React.ReactNode;
}

const Page = styled.div({
  minHeight: '100%',
  backgroundColor: '#f5f5f5',
  paddingBottom: '2rem',
  boxSizing: 'border-box',
});

const Menu = styled.div({
  position: 'sticky',
  top: 0,
  right: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'row',
  margin: 0,
  padding: '1rem 0',
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold',
  boxShadow: theShadow,
  zIndex: 1000,
  [breakPoints.mobile]: {
    flexDirection: 'column',
  },
});

const MenuHeader = styled(Link)({
  color: primaryColor,
  fontSize: '2rem',
  textDecoration: 'none',
  margin: '0 1rem',
  paddingLeft: '32px',
  '> img': {
    position: 'absolute',
    left: '.5rem',
  },
  ':hover': {
    color: primaryHighlightColor,
  },
});

const MenuSpacer = styled.div({
  flex: 1,
});

const MenuJoinForm = styled.form({
  margin: '0 1rem 0 1rem',
  display: 'flex',
  flexDirection: 'row',
  '> input': {
    fontSize: '1.2rem',
    color: '#333',
    margin: '0 1rem 0 0',
    width: '100px',
    ':nth-child(1)': {
      width: '180px',
    },
  },
  [breakPoints.mobile]: {
    marginRight: '1rem',
    marginTop: '1rem',
    '> button': {
      flex: 1,
    },
    '> input': {
      width: '33%',
      marginBottom: '.5rem',
      ':nth-child(1)': {
        width: '33%',
      },
    },
  },
  [breakPoints.tablet]: {
    '> input': {
      width: '80px',
      ':nth-child(1)': {
        width: '80px',
      },
    },
  },
});

const MenuLink = styled(Link)({
  fontSize: '1.5rem',
  fontWeight: 'normal',
  textDecoration: 'none',
  margin: '0 1rem 0 0',
  backgroundColor: primaryColor,
  color: '#fff',
  padding: '.5rem 1rem',
  borderRadius: '4px',
  textAlign: 'center',
  ':hover': {
    backgroundColor: primaryHighlightColor,
    color: '#fff',
  },
  [breakPoints.mobile]: {
    marginTop: '.5rem',
  },
});

export const Content = styled.div({
  maxWidth: '960px',
  margin: '0 auto',
  padding: '0 2rem',
});

const Footer = styled.div({
  maxWidth: '960px',
  margin: '2rem auto',
  padding: '2rem',
  textAlign: 'center',
  color: '#ccc',
  borderTop: '1px solid #ddd',
});

export function WebPage(props: Props) {
  const history = useHistory();
  const hostIdRef = React.createRef<HTMLInputElement>();
  const gameIdRef = React.createRef<HTMLInputElement>();
  const handleSubmitJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      hostIdRef.current &&
      hostIdRef.current.value &&
      gameIdRef.current &&
      gameIdRef.current.value
    ) {
      const hostId = hostIdRef.current.value;
      const gameId = gameIdRef.current.value;
      history.push(`/play/${hostId}/${gameId}`);
    }
  };

  return (
    <Page>
      <Menu>
        <MenuHeader to="/">
          <img src={imagePrefix + 'favicon-32x32.png'} alt="favicon" />
          Board Game Star
        </MenuHeader>
        <MenuSpacer />
        <MenuJoinForm onSubmit={handleSubmitJoin}>
          <input type="text" placeholder="Host ID" ref={hostIdRef} />
          <input type="text" placeholder="Game ID" ref={gameIdRef} />
          <Button design="primary" type="submit">
            Join Game
          </Button>
        </MenuJoinForm>
        {isWebBuild && <MenuLink to="/games">Start New Game</MenuLink>}
      </Menu>
      {props.children}
      <Footer>&copy; Copyright {new Date().getFullYear()}</Footer>
    </Page>
  );
}
