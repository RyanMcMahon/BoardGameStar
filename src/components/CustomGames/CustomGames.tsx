import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';

import { createNewGame, Game } from '../../utils/game';
import { loadAsset } from '../../utils/assets';
import { Redirect } from 'react-router-dom';
import { GameConfig, EditorConfig, EditorAction } from '../../types';
import { GameSelector } from '../GameSelector';
import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { CreateGameModal } from '../CreateGameModal';

const fs = window.require('fs');
const { NodeVM, VMScript } = window.require('vm2');

interface Props {
  dispatch: React.Dispatch<EditorAction>;
}

const Container = styled.div({
  padding: '2rem 0',
});

export function CustomGames(props: Props) {
  const [games, setGames] = React.useState<any>([]);
  const [gameConfigs, setGameConfigs] = React.useState<any>({});
  const [showCreateModal, setShowCreateModal] = React.useState<boolean>(false);
  const [newGame, setNewGame] = React.useState<Game>();
  const handleGameSelect = (gameName: string, config: GameConfig) => () => {
    const assets: { [key: string]: string } = {};
    console.log(config.curScenario);

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

    createNewGame(config, { assets, sendAssets: false }, game => {
      console.log(game);
      setNewGame(game);
    });
  };

  const handleCreateGame = (editorConfig: EditorConfig) => {
    props.dispatch({
      editorConfig,
      type: 'create_game',
    });
  };

  React.useEffect(() => {
    const gameNames = fs.existsSync('./games')
      ? fs.readdirSync('./games').filter((x: string) => x !== '.gitkeep')
      : [];
    const configs: any = {};
    const vm = new NodeVM();

    // console.log(rootPath);
    for (let i = 0; i < gameNames.length; i++) {
      const gameName = gameNames[i];

      try {
        const script = new VMScript(
          fs.readFileSync(`./games/${gameName}/config.js`)
        );
        const config = _.cloneDeep(vm.run(script));
        configs[gameName] = config;
        console.log(config);
      } catch (err) {
        console.log(err);
      }
    }

    setGames(gameNames);
    setGameConfigs(configs);
  }, []);

  if (newGame) {
    return <Redirect to={`/play/${newGame.hostId}/${newGame.gameId}`} />;
  }

  return (
    <WebPage>
      <Content>
        <Container>
          {/* <Link to="/editor">
            <Button design="primary">Create New Game</Button>
          </Link> */}
          <Button design="primary" onClick={() => setShowCreateModal(true)}>
            Create New Game
          </Button>
          {games.map((game: any) => (
            <GameSelector
              key={game}
              gameName={game}
              config={gameConfigs[game]}
              onGameSelect={handleGameSelect(game, gameConfigs[game])}
            />
          ))}
          {!games.length && <h1>No Custom Games</h1>}
          {showCreateModal && (
            <CreateGameModal
              onCreate={handleCreateGame}
              onClose={() => setShowCreateModal(false)}
            />
          )}
        </Container>
      </Content>
    </WebPage>
  );
}

export default CustomGames;
