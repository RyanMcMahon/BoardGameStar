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
import { getCurrentUser, signOut, useUser } from '../../utils/api';
import { TagSelect } from '../TagSelect/TagSelect';

interface Props {
  children: React.ReactNode;
}

const Page = styled.div({
  minHeight: '100%',
  // backgroundColor: '#f5f5f5',
  // paddingBottom: '2rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
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
  backgroundColor: primaryColor,
  fontWeight: 'bold',
  boxShadow: theShadow,
  zIndex: 1000,
  [breakPoints.mobile]: {
    flexDirection: 'column',
  },
});

const MenuHeader = styled(Link)({
  color: '#fff',
  fontSize: '2rem',
  textDecoration: 'none',
  margin: '0 1rem',
  paddingLeft: '32px',
  '> img': {
    position: 'absolute',
    left: '.5rem',
  },
  ':hover': {
    color: '#fff',
  },
});

const MenuSpacer = styled.div({
  flex: 1,
});

// const MenuJoinForm = styled.form({
//   marginLeft: '1rem',
//   display: 'flex',
//   flexDirection: 'row',
//   '> input': {
//     fontSize: '1.2rem',
//     color: '#333',
//     margin: '0 1rem 0 0',
//     width: '100px',
//     ':nth-child(1)': {
//       width: '180px',
//     },
//   },
//   [breakPoints.mobile]: {
//     marginRight: '1rem',
//     marginTop: '1rem',
//     '> button': {
//       flex: 1,
//     },
//     '> input': {
//       width: '33%',
//       marginBottom: '.5rem',
//       ':nth-child(1)': {
//         width: '33%',
//       },
//     },
//   },
//   [breakPoints.tablet]: {
//     '> input': {
//       width: '80px',
//       ':nth-child(1)': {
//         width: '80px',
//       },
//     },
//   },
// });

const NewGameLink = styled(Link)({
  textDecoration: 'none',
  [breakPoints.mobile]: {
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
  },
});

const NewGameButton = styled(Button)({
  margin: '0 1rem',
  flex: 1,
});

export const Content = styled.div({
  // maxWidth: '960px',
  // margin: '0 auto',
  // padding: '0 2rem',
});

const ContentContainer = styled.div({
  display: 'flex',
  flexDirection: 'row',
  flex: 1,
});

const MainContent = styled.div({
  padding: '2rem',
  flex: 1,
});

const SideMenu = styled.div({
  backgroundColor: '#f0f0f0',
  width: '240px',
  padding: '2rem 1rem',
});

const Footer = styled.div({
  // maxWidth: '960px',
  // margin: '2rem auto',
  backgroundColor: '#333',
  padding: '2rem',
  textAlign: 'center',
  color: '#fff',
  // borderTop: '1px solid #ddd',
});

export function WebPage(props: Props) {
  const history = useHistory();
  const { currentUser, isLoading } = useUser();
  const [tags, setTags] = React.useState<string[]>([]);
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
          <img src="favicon-32x32_white.png" alt="favicon" />
          Board Game Star
        </MenuHeader>
        <MenuSpacer />
      </Menu>

      <ContentContainer>
        <SideMenu>
          {!isLoading && (
            <>
              {currentUser ? (
                <NewGameLink to="/my-account">
                  {currentUser!.displayName || currentUser!.email}
                </NewGameLink>
              ) : (
                <>
                  <NewGameLink to="/sign-up">Sign Up</NewGameLink>
                  <NewGameLink to="/log-in">Log In</NewGameLink>
                </>
              )}
            </>
          )}

          <form onSubmit={handleSubmitJoin}>
            <input
              className="u-full-width"
              type="text"
              placeholder="Host ID"
              ref={hostIdRef}
            />
            <input
              className="u-full-width"
              type="text"
              placeholder="Game ID"
              ref={gameIdRef}
            />
            <Button design="primary" type="submit" block={true}>
              Join Game
            </Button>
          </form>

          <hr />

          <NewGameLink to="/games">My Games</NewGameLink>

          <hr />

          <h3>Search</h3>
          <TagSelect tags={tags} onUpdate={setTags} />
        </SideMenu>
        <MainContent>{props.children}</MainContent>
      </ContentContainer>

      <Footer>&copy; Copyright {new Date().getFullYear()}</Footer>
    </Page>
  );
}
