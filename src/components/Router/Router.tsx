import React from 'react';
import { BrowserRouter, HashRouter, Switch, Route } from 'react-router-dom';

import { App } from '../App';
import { IncludedGames } from '../IncludedGames';
import { isWebBuild } from '../../utils/meta';

interface Props {
  children: React.ReactNode;
}

const BaseRoute = React.lazy(() =>
  isWebBuild ? import('../Home/Home') : import('../CustomGames/CustomGames')
);

function AppRouter(props: Props) {
  return isWebBuild ? (
    <BrowserRouter>{props.children}</BrowserRouter>
  ) : (
    <HashRouter>{props.children}</HashRouter>
  );
}

export function Router() {
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
    </AppRouter>
  );
}
