import React from 'react';
import {
  BrowserRouter,
  HashRouter,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';

import { App } from '../App';
import { UpdateModal } from '../UpdateModal';
import { isWebBuild } from '../../utils/meta';
import { Games } from '../Games';
import { Editor, editorReducer } from '../Editor';
import { EditorAction, EditorState } from '../../types';
import { LogIn } from '../LogIn';
import { SignUp } from '../SignUp';
import { Store } from '../Store';
import { MyAccount } from '../MyAccount';
import { UserProfile } from '../UserProfile';
import { GameProfile } from '../GamePage';
import { WebPage } from '../WebPage';
import { Terms } from '../Terms';
import { Privacy } from '../Privacy';

interface Props {
  children: React.ReactNode;
}

function AppRouter(props: Props) {
  return isWebBuild ? (
    <BrowserRouter>{props.children}</BrowserRouter>
  ) : (
    <HashRouter>{props.children}</HashRouter>
  );
}

export function Router() {
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);
  const [release, setRelease] = React.useState();
  const [state, dispatch] = React.useReducer<
    React.Reducer<EditorState, EditorAction>,
    EditorState
  >(
    editorReducer,
    {
      renderCount: 0,
      version: 1,
      id: '',
      store: isWebBuild ? 'browser' : 'file',
      name: '',
      tags: [],
      summary: '',
      description: '',
      curScenario: '',
      scenarios: {},
      pieces: {},
    },
    (state: EditorState) => state
  );

  React.useEffect(() => {
    if (!isWebBuild) {
      const appVersion = window.require('electron').remote.app.getVersion();
      const version = `v${appVersion}`;

      const checkForUpdate = async () => {
        const data = await fetch(
          `https://api.github.com/repos/RyanMcMahon/BoardGameStar/releases/latest`
        );
        const release = await data.json();
        if (release.tag_name && release.tag_name !== version) {
          setRelease(release);
          setShowUpdateModal(true);
        }
      };

      checkForUpdate();
    }
  }, []);

  return (
    <AppRouter>
      <Switch>
        <Route path="/play/:hostId/:gameId">
          <App />
        </Route>
        <Route path="/spectate/:hostId/:gameId">
          <App spectator={true} />
        </Route>

        <Route path="/editor">
          {state.curScenario ? (
            <Editor dispatch={dispatch} state={state} />
          ) : (
            <Redirect to="/games" />
          )}
        </Route>

        <Route path="/">
          <WebPage>
            <Switch>
              <Route path="/sign-up">
                <SignUp />
              </Route>
              <Route path="/log-in">
                <LogIn />
              </Route>
              <Route path="/my-account">
                <MyAccount />
              </Route>
              <Route path="/users/:userId">
                <UserProfile />
              </Route>
              <Route path="/games/:gameId">
                <GameProfile />
              </Route>

              <Route exact path="/games">
                {state.curScenario ? (
                  <Redirect to="/editor" />
                ) : (
                  <Games dispatch={dispatch} />
                )}
              </Route>

              <Route path="/terms">
                <Terms />
              </Route>

              <Route path="/privacy">
                <Privacy />
              </Route>

              <Route exact path="/">
                <Store />
              </Route>
            </Switch>
          </WebPage>
        </Route>
      </Switch>

      {showUpdateModal && (
        <UpdateModal
          onClose={() => setShowUpdateModal(false)}
          release={release}
        />
      )}
    </AppRouter>
  );
}
