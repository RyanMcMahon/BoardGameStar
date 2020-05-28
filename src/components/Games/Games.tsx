import _ from 'lodash';
import React from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { createNewGame, Game } from '../../utils/game';
import { GameConfig, EditorConfig, EditorAction } from '../../types';
import { Aviary } from '../../games/aviary';
import { Cards } from '../../games/cards';
import { Chess } from '../../games/chess';
import { Checkers } from '../../games/checkers';
import { WebPage, Content } from '../WebPage';
import { GameSelector } from '../GameSelector';
import { isWebBuild } from '../../utils/meta';
import { loadAsset } from '../../utils/assets';
import { Button } from '../../utils/style';
import { CreateGameModal } from '../CreateGameModal';
import { loadGames } from '../../utils/store';
import { getPlayerId } from '../../utils/identity';

interface Props {
  dispatch: React.Dispatch<EditorAction>;
}

const loadConfigs = async () => {
  const playerId = getPlayerId();

  // Included Games
  const configs: GameConfig[] = [Aviary, Checkers, Chess, Cards].map(
    config => ({
      ...config,
      store: 'included',
      playerId,
      sendAssets: true,
      loadAssets: () => {
        const assets: { [key: string]: string } = {};
        Object.values(config.pieces).forEach((piece: any) => {
          if (piece.image) {
            assets[piece.image] = piece.image;
          }
        });
        return assets;
      },
    })
  );

  // Load Synced Games
  const syncConfigs = await loadGames();
  configs.push(
    ...syncConfigs.map(sync => ({
      ...sync.config,
      playerId,
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

export function Games(props: Props) {
  const [configs, setConfigs] = React.useState<GameConfig[]>([]);
  const [newGame, setNewGame] = React.useState<Game>();
  const [showCreateModal, setShowCreateModal] = React.useState<boolean>(false);
  const handleGameSelect = (config: GameConfig) => {
    const { loadAssets, sendAssets } = config;
    const assets = loadAssets();
    createNewGame(config, { assets, sendAssets }, game => {
      setNewGame(game);
    });
  };

  const handleCreateGame = (editorConfig: EditorConfig) => {
    props.dispatch({
      editorConfig,
      type: 'create_game',
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
    <WebPage>
      <Content>
        <Container>
          {!isWebBuild && (
            <>
              <Button design="primary" onClick={() => setShowCreateModal(true)}>
                Create New Game
              </Button>
              <hr />
            </>
          )}

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
                onReloadConfigs={load}
              />
            ))}
        </Container>

        {showCreateModal && (
          <CreateGameModal
            onCreate={handleCreateGame}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </Content>
    </WebPage>
  );
}
