import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import {
  primaryColor,
  breakpoints,
  Button,
  theShadow,
} from '../../utils/style';
import { useUser } from '../../utils/api';
// import { TagSelect } from '../TagSelect/TagSelect';
import { FaBars } from 'react-icons/fa';
import { useWebContext } from '../../utils/WebContext';
import { supportedBrowser } from '../../utils/meta';

interface Props {
  children: React.ReactNode;
}

const Page = styled.div({
  minHeight: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
});

const Menu = styled.div({
  position: 'sticky',
  top: 0,
  right: 0,
  left: 0,
  flexDirection: 'row',
  margin: 0,
  padding: '1rem 0',
  backgroundColor: primaryColor,
  fontWeight: 'bold',
  boxShadow: theShadow,
  zIndex: 1000,
});

const BrowserSupportBanner = styled.div({
  backgroundColor: '#f1c40f',
  textAlign: 'center',
  position: 'relative',
  top: '-1rem',
});

const MenuHeader = styled(Link)({
  color: '#fff',
  fontSize: '28px',
  textDecoration: 'none',
  margin: '0 1rem',
  position: 'relative',
  top: '-3px',
  '> img': {
    position: 'relative',
    top: '6px',
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

const ButtonLink = styled(Link)({
  textDecoration: 'none',
});

export const Content = styled.div({
  // TODO
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

const ErrorMessage = styled.div({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  backgroundColor: '#e74c3c',
  color: '#fff',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '2rem',
  padding: '1rem 0',
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
  backgroundColor: '#333',
  padding: '2rem',
  textAlign: 'center',
  color: '#fff',
  a: {
    color: '#fff',
    textDecoration: 'none',
  },
});

export function WebPage(props: Props) {
  const context = useWebContext();
  const { state } = context;
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isLoading } = useUser() as any;
  // const [tags, setTags] = React.useState<string[]>([]);
  const [isSideMenuVisible, setIsSideMenuVisible] =
    React.useState<boolean>(false);
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
      navigate(`/play/${hostId}/${gameId}`);
    }
  };

  React.useEffect(() => setIsSideMenuVisible(false), [location]);

  return (
    <Page>
      {state.errorMessage && <ErrorMessage>{state.errorMessage}</ErrorMessage>}
      <Menu>
        {!supportedBrowser && (
          <BrowserSupportBanner>
            This browser may not be supported
          </BrowserSupportBanner>
        )}
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
        &nbsp;|&nbsp;
        <Link to="/terms">Terms of Service</Link>
        &nbsp;|&nbsp;
        <Link to="/privacy">Privacy Policy</Link>
        &nbsp;|&nbsp;
        <a href="mailto:support@ordinarybytes.com">support@ordinarybytes.com</a>
      </Footer>
    </Page>
  );
}
