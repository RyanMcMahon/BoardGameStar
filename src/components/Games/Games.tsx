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

interface Props {
  dispatch: React.Dispatch<EditorAction>;
}

const configs: GameConfig[] = [
  Aviary as any,
  Checkers as any,
  Chess as any,
  Cards as any,
].map(config => ({
  ...config,
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
}));

// Load Custom Game Files
if (!isWebBuild) {
  const fs = window.require('fs');
  const { NodeVM, VMScript } = window.require('vm2');

  const gameNames = fs.existsSync('./games')
    ? fs.readdirSync('./games').filter((x: string) => x !== '.gitkeep')
    : [];
  const vm = new NodeVM();

  for (let i = 0; i < gameNames.length; i++) {
    const gameName = gameNames[i];

    try {
      const script = new VMScript(
        fs.readFileSync(`./games/${gameName}/config.js`)
      );
      const config = _.cloneDeep(vm.run(script));
      configs.push({
        ...config,
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
              assets[key] = loadAsset(`./games/${gameName}/images/${key}`);
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

const Container = styled.div({
  padding: '2rem 0',
});

export function Games(props: Props) {
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
              a.gameName.toLowerCase() > b.gameName.toLowerCase() ? 1 : -1
            )
            .map((config, index) => (
              <GameSelector
                key={config.id || config.gameName + index}
                gameName={config.gameName}
                config={config}
                onGameSelect={handleGameSelect}
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
