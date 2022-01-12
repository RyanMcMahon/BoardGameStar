import React from 'react';
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
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
import { useWebReducer, WebContext } from '../../utils/WebContext';

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
  const webReducer = useWebReducer();
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);
  const [release, setRelease] = React.useState();
  const [editorState, editorDispatch] = React.useReducer<
    React.Reducer<EditorState, EditorAction>,
    EditorState
  >(
    editorReducer,
    {
      renderCount: 0,
      version: 0,
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
    (editorState: EditorState) => editorState
  );

  React.useEffect(() => {
    // if (!isWebBuild) {
    //   const appVersion = window.require('electron').remote.app.getVersion();
    //   const version = `v${appVersion}`;
    //   const checkForUpdate = async () => {
    //     const data = await fetch(
    //       `https://api.github.com/repos/RyanMcMahon/BoardGameStar/releases/latest`
    //     );
    //     const release = await data.json();
    //     if (release.tag_name && release.tag_name !== version) {
    //       setRelease(release);
    //       setShowUpdateModal(true);
    //     }
    //   };
    //   checkForUpdate();
    // }
  }, []);

  return (
    <AppRouter>
      <WebContext.Provider value={webReducer}>
        <Routes>
          <Route path="/play/:hostId/:gameId" element={<App />} />
          <Route
            path="/spectate/:hostId/:gameId"
            element={<App spectator={true} />}
          />

          <Route
            path="/editor"
            element={
              editorState.curScenario ? (
                <Editor dispatch={editorDispatch} state={editorState} />
              ) : (
                <Navigate to="/games" />
              )
            }
          />

          <Route
            path="/*"
            element={
              <WebPage>
                <Routes>
                  <Route path="/sign-up" element={<SignUp />} />
                  <Route path="/log-in" element={<LogIn />} />
                  <Route path="/my-account" element={<MyAccount />} />
                  <Route path="/users/:userId" element={<UserProfile />} />

                  <Route
                    path="/games"
                    element={
                      editorState.curScenario ? (
                        <Navigate to="/editor" />
                      ) : (
                        <Games dispatch={editorDispatch} />
                      )
                    }
                  />
                  <Route path="/games/:gameId" element={<GameProfile />} />

                  <Route path="/terms" element={<Terms />} />

                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/" element={<Store />} />
                </Routes>
              </WebPage>
            }
          />
        </Routes>

        {showUpdateModal && (
          <UpdateModal
            onClose={() => setShowUpdateModal(false)}
            release={release}
          />
        )}
      </WebContext.Provider>
    </AppRouter>
  );
}
