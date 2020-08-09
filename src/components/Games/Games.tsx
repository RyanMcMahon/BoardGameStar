import _ from 'lodash';
import slug from 'slugid';
import React from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { createNewGame, GameState } from '../../utils/game';
import { EditorConfig, EditorAction, Game } from '../../types';
// import { Aviary } from '../../games/aviary';
import { Cards } from '../../games/cards';
import { Chess } from '../../games/chess';
import { Checkers } from '../../games/checkers';
import { GameSelector } from '../GameSelector';
import { isWebBuild } from '../../utils/meta';
import { loadAsset } from '../../utils/assets';
import { Button, breakpoints } from '../../utils/style';
import { CreateGameModal } from '../CreateGameModal';
import { loadGames } from '../../utils/store';
import { getPlayerId } from '../../utils/identity';

interface Props {
  dispatch: React.Dispatch<EditorAction>;
}

const loadConfigs = async () => {
  const playerId = getPlayerId();

  // Included Games
  const configs: Game[] = [];
  // [Checkers, Chess, Cards].map(config => ({
  //   ...config,
  //   store: 'included',
  //   // playerId,
  //   sendAssets: true,
  //   loadAssets: () => {
  //     const assets: { [key: string]: string } = {};
  //     Object.values(config.config.pieces).forEach((piece: any) => {
  //       if (piece.image) {
  //         assets[piece.image] = piece.image;
  //       }
  //     });
  //     return assets;
  //   },
  // }));

  // Load Synced Games
  const syncConfigs = await loadGames();
  configs.push(
    ...syncConfigs.map(sync => ({
      ...sync.config,
      price: 0,
      // playerId,
      store: 'browser' as const,
      sendAssets: false,
      loadAssets: () => sync.assets,
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
  // gridTemplateColumns: 'repeat(6, 1fr)',
  // [breakPoints.tablet]: {
  //   gridTemplateColumns: 'repeat(3, 1fr)',
  // },
  // [breakPoints.mobile]: {
  //   gridTemplateColumns: 'repeat(2, 1fr)',
  // },
});

export function Games(props: Props) {
  const [configs, setConfigs] = React.useState<Game[]>([]);
  const [newGame, setNewGame] = React.useState<GameState>();
  const [showCreateModal, setShowCreateModal] = React.useState<boolean>(false);
  const handleGameSelect = (game: Game) => {
    const { loadAssets = () => ({}), sendAssets = true } = game;
    const assets = loadAssets();
    createNewGame(game, { assets, sendAssets }, game => {
      setNewGame(game);
    });
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

  const handleEditGame = (game: Game) => {
    props.dispatch({
      config: {
        ...game,
        ...game.config,
        assets: game.loadAssets ? game.loadAssets() : {},
      },
      type: 'edit_game',
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
    return <Redirect to={`/play/${newGame.hostId}/${newGame.gameId}`} />;
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
