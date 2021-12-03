import _ from 'lodash';
import slug from 'slugid';
import React from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { Loader } from 'pixi.js';

import { createNewGame, GameState } from '../../utils/game';
import { EditorAction, Game } from '../../types';
import { GameSelector } from '../GameSelector';
import { isWebBuild } from '../../utils/meta';
import { loadAsset } from '../../utils/assets';
import { Button } from '../../utils/style';
import { CreateGameModal } from '../CreateGameModal';
import { loadGames, loadAssets } from '../../utils/store';
import { getPlayerId } from '../../utils/identity';
import { useWebContext } from '../../utils/WebContext';

interface Props {
  dispatch: React.Dispatch<EditorAction>;
}

const loadConfigs = async () => {
  const playerId = getPlayerId();

  const configs: Game[] = [];

  // Load Synced Games
  const syncConfigs = await loadGames();
  configs.push(
    ...syncConfigs.map(sync => ({
      ...sync.config,
      price: 0,
      // playerId,
      store: 'browser' as const,
      sendAssets: false,
      loadAssets: () => loadAssets(sync.gameId),
    }))
  );

  // Load Custom Game Files
  if (!isWebBuild) {
    const fs = window.require('fs');
    const { NodeVM, VMScript } = window.require('vm2');

    const names = fs.existsSync('./games')
      ? fs.readdirSync('./games').filter((x: string) => x !== '.gitkeep')
      : [];
    const vm = new NodeVM();

    for (let i = 0; i < names.length; i++) {
      const name = names[i];

      try {
        const script = new VMScript(
          fs.readFileSync(`./games/${name}/config.js`)
        );
        const config = _.cloneDeep(vm.run(script));
        if (!config.id) {
          config.id = `${config.name || config.gameName}_${config.curScenario}`;
        }
        configs.push({
          ...config,
          playerId,
          store: 'file',
          sendAssets: false,
          loadAssets: () => {
            const assets: { [key: string]: string } = {};

            Object.values(config.pieces).forEach((piece: any) => {
              if (piece.image) {
                assets[piece.image] = '';
              }
            });

            for (let key in assets) {
              if (!assets[key]) {
                assets[key] = loadAsset(`./games/${name}/images/${key}`);
              }
            }
            return assets;
          },
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  return configs;
};

const Container = styled.div({
  padding: '2rem 0',
});

const GamesWrapper = styled.div({
  display: 'grid',
  gridGap: '1rem',
  // gridAutoRows: 'minmax(100px, 300px)',
  ...[0, 300, 600, 900, 1200, 1500, 1800].reduce(
    (agg, breakpoint, index, arr) => ({
      ...agg,
      [`@media (min-width: ${breakpoint}px) and (max-width: ${arr[index + 1] ||
        999999}px)`]: {
        gridTemplateColumns: `repeat(${breakpoint / 300}, 1fr)`,
      },
    }),
    {}
  ),
});

export function Games(props: Props) {
  const { alertError } = useWebContext();
  const [configs, setConfigs] = React.useState<Game[]>([]);
  const [newGame, setNewGame] = React.useState<GameState>();
  const [showCreateModal, setShowCreateModal] = React.useState<boolean>(false);
  const [loadingGame, setLoadingGame] = React.useState(false);

  const handleGameSelect = async (game: Game) => {
    try {
      setLoadingGame(true);

      const { loadAssets = () => ({}), sendAssets = true } = game;
      const assets = await loadAssets();
      await createNewGame(game, { assets, sendAssets }, game => {
        setNewGame(game);
      });
      setLoadingGame(false);
    } catch (err) {
      alertError('Error Starting Game (Refresh and Retry)');
      setLoadingGame(false);
    }
  };

  const handleCreateGame = (name: string) => {
    const id = slug.nice();
    const myGames = (window.localStorage.getItem('my_games') || '')
      .split(',')
      .filter((x: string) => x);
    window.localStorage.setItem('my_games', [...myGames, id].join(','));
    props.dispatch({
      id,
      name,
      type: 'create_game',
    });
  };

  const handleEditGame = async (game: Game) => {
    setLoadingGame(true);

    const loadedAssets = game.loadAssets ? await game.loadAssets() : {};
    Loader.shared.reset();
    Loader.shared.add('axis.png');
    for (let name in loadedAssets) {
      Loader.shared.add(name, loadedAssets[name]);
    }

    Loader.shared.load(() => {
      props.dispatch({
        config: {
          ...game,
          ...game.config,
          renderCount: 0,
          assets: loadedAssets,
        },
        type: 'edit_game',
      });
      setLoadingGame(false);
    });
  };

  const load = async () => {
    const configs = await loadConfigs();
    setConfigs(configs);
  };

  React.useEffect(() => {
    load();
  }, []);

  if (newGame) {
    return <Navigate to={`/play/${newGame.hostId}/${newGame.gameId}`} />;
  }

  return (
    <>
      <Container>
        <h1>My Games</h1>
        <Button design="primary" onClick={() => setShowCreateModal(true)}>
          Create New Game
        </Button>
        <hr />

        <GamesWrapper>
          {configs
            .sort((a, b) =>
              a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
            )
            .map((config, index) => (
              <GameSelector
                disabled={loadingGame}
                key={config.id || config.name + index}
                name={config.name}
                config={config}
                onGameSelect={handleGameSelect}
                onEditGame={handleEditGame}
                onReloadConfigs={load}
              />
            ))}
        </GamesWrapper>
      </Container>

      {showCreateModal && (
        <CreateGameModal
          onCreate={handleCreateGame}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}
