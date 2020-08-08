import React from 'react';
import styled from 'styled-components';
import { Link, useHistory } from 'react-router-dom';

import {
  primaryColor,
  primaryHighlightColor,
  breakpoints,
  Button,
  theShadow,
} from '../../utils/style';
import { isWebBuild } from '../../utils/meta';
import { imagePrefix } from '../../utils/assets';
import { getCurrentUser, signOut, useUser } from '../../utils/api';
import { TagSelect } from '../TagSelect/TagSelect';
import { FaBars } from 'react-icons/fa';

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
  // [breakpoints.mobile]: {
  //   flexDirection: 'column',
  // },
});

const MenuHeader = styled(Link)({
  color: '#fff',
  fontSize: '28px',
  textDecoration: 'none',
  margin: '0 1rem',
  // paddingLeft: '32px',
  position: 'relative',
  top: '-3px',
  '> img': {
    position: 'relative',
    top: '6px',
    // left: '.5rem',
  },
  ':hover': {
    color: '#fff',
  },
});

const SideMenuButton = styled(FaBars)({
  fontSize: '28px',
  color: '#fff',
  display: 'inline-block',
  cursor: 'pointer',
  position: 'relative',
  top: '6px',
  marginLeft: '1.5rem',
  [breakpoints.desktop]: {
    display: 'none',
  },
});

// const MenuSpacer = styled.div({
//   flex: 1,
// });

// const NewGameLink = styled(Link)({
//   textDecoration: 'none',
//   [breakpoints.mobile]: {
//     width: '100%',
//     boxSizing: 'border-box',
//     display: 'flex',
//   },
// });

const ButtonLink = styled(Link)({
  textDecoration: 'none',
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

const SideMenu = styled.div<{ shown: boolean }>(({ shown }) => ({
  backgroundColor: '#f0f0f0',
  width: '240px',
  padding: '2rem 1rem',
  position: 'fixed',
  height: '100vh',
  overflowY: 'scroll',
  zIndex: 900,
  left: shown ? 0 : '-280px',
  transition: 'left 0.2s ease-in',
  [breakpoints.desktop]: {
    left: 0,
    height: 'auto',
    position: 'relative',
  },
}));

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
  const [isSideMenuVisible, setIsSideMenuVisible] = React.useState<boolean>(
    false
  );
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

  React.useEffect(() => setIsSideMenuVisible(false), [history.location]);

  return (
    <Page>
      <Menu>
        <SideMenuButton
          onClick={() => setIsSideMenuVisible(!isSideMenuVisible)}
        />
        <MenuHeader to="/">
          <img src="favicon-32x32_white.png" alt="favicon" />
          Board Game Star
        </MenuHeader>
      </Menu>

      <ContentContainer>
        <SideMenu shown={isSideMenuVisible}>
          {!isLoading && (
            <>
              {currentUser ? (
                <ButtonLink to="/my-account">
                  <Button design="primary" block={true}>
                    {currentUser!.displayName || currentUser!.email}
                  </Button>
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/sign-up">
                    <Button design="primary" block={true}>
                      Sign Up
                    </Button>
                  </ButtonLink>
                  <ButtonLink to="/log-in">
                    <Button design="primary" block={true}>
                      Log In
                    </Button>
                  </ButtonLink>
                </>
              )}
            </>
          )}

          <ButtonLink to="/">
            <Button design="primary" block={true}>
              All Games
            </Button>
          </ButtonLink>

          <ButtonLink to="/games">
            <Button design="primary" block={true}>
              My Games
            </Button>
          </ButtonLink>

          <form onSubmit={handleSubmitJoin}>
            <label>Join Game</label>
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

          {/* <h3>Search</h3>
          <TagSelect tags={tags} onUpdate={setTags} /> */}
        </SideMenu>
        <MainContent>{props.children}</MainContent>
      </ContentContainer>

      <Footer>
        &copy; Copyright {new Date().getFullYear()}
        <Link to="/terms">Terms of Service</Link>
        <Link to="/privacy">Privacy Policy</Link>
      </Footer>
    </Page>
  );
}
