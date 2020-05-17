import React from 'react';
import { BrowserRouter, HashRouter, Switch, Route } from 'react-router-dom';

import { App } from '../App';
import { IncludedGames } from '../IncludedGames';
import { UpdateModal } from '../UpdateModal';
import { isWebBuild } from '../../utils/meta';

interface Props {
  children: React.ReactNode;
}

const BaseRoute = React.lazy(() =>
  isWebBuild ? import('../Home/Home') : import('./ExecutableRoutes')
);

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

  React.useEffect(() => {
    if (!isWebBuild) {
      const fs = window.require('fs');
      const json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const version = `v${json.version}`;

      const checkForUpdate = async () => {
        const data = await fetch(
          `https://api.github.com/repos/RyanMcMahon/BoardGameStar/releases/latest`
        );
        const release = await data.json();
        console.log('version', version);
        console.log('version', release);
        if (release.tag_name && release.tag_name !== version) {
          console.log('needs update');
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
        <Route path="/play/:gameId">
          <App />
        </Route>
        <Route path="/game-select">
          <IncludedGames />
        </Route>
        <Route path="/">
          <React.Suspense fallback={null}>
            <BaseRoute />
          </React.Suspense>
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
