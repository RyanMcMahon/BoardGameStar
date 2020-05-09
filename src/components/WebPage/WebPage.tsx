import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { primaryColor, primaryHighlightColor } from '../../utils/style';
import { isWebBuild, imagePrefix } from '../../utils/meta';

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
  boxShadow: '0px 3px 7px rgba(0, 0, 0, 0.5)',
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

const MenuGameId = styled.input({
  width: '280px',
  fontSize: '1.2rem',
  margin: '0 0 0 1rem',
  color: '#333',
  padding: '0 .5rem',
  borderRadius: '4px',
});

const MenuLink = styled(Link)({
  fontSize: '1.5rem',
  textDecoration: 'none',
  margin: '0 1rem',
  backgroundColor: primaryColor,
  color: '#fff',
  padding: '.5rem 1rem',
  borderRadius: '4px',
  ':hover': {
    backgroundColor: primaryHighlightColor,
    color: '#fff',
  },
});

export const Content = styled.div({
  maxWidth: '960px',
  margin: '0 auto',
  padding: '0 2rem',
});

export function WebPage(props: Props) {
  const [gameId, setGameId] = React.useState('');
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameId(e.target.value);
  };
  return (
    <Page>
      <Menu>
        <MenuHeader to="/">
          <img src={imagePrefix + 'favicon-32x32.png'} alt="favicon" />
          Board Game Star
        </MenuHeader>
        <MenuSpacer />
        <MenuGameId placeholder="Game ID" onChange={handleOnChange} />
        <MenuLink to={`/play/${gameId}`}>Join Game</MenuLink>
        <MenuLink to="/game-select">
          {isWebBuild ? 'Start New Game' : 'Included Games'}
        </MenuLink>
        {!isWebBuild && <MenuLink to="/">Custom Games</MenuLink>}
      </Menu>
      {props.children}
    </Page>
  );
}
