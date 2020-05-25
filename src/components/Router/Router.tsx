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
import { Home } from '../Home';
import { Editor, editorReducer } from '../Editor';
import {
  EditorAction,
  PlayerOption,
  EditorState,
  AnyPieceOption,
} from '../../types';

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
      gameName: '',
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
        <Route path="/games">
          {state.curScenario ? (
            <Editor dispatch={dispatch} state={state} />
          ) : (
            <Games dispatch={dispatch} />
          )}
        </Route>
        <Route path="/">
          {isWebBuild ? <Home /> : <Redirect to="games" />}
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
