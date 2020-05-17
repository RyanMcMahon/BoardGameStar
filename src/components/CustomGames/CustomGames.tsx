import React from 'react';
import styled from 'styled-components';

import { newGame } from '../../utils/game';
import { loadAsset } from '../../utils/assets';
import { Redirect } from 'react-router-dom';
import {
  CardOption,
  GameConfig,
  EditorConfig,
  EditorAction,
} from '../../types';
import { GameSelector } from '../GameSelector';
import { WebPage, Content } from '../WebPage';
import { Button } from '../../utils/style';
import { CreateGameModal } from '../CreateGameModal';

const fs = window.require('fs');

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
  const [newGameId, setNewGameId] = React.useState<string>();
  const handleGameSelect = (gameName: string, config: GameConfig) => () => {
    const assets: { [key: string]: string } = {};

    config.board.forEach(item => {
      if (item.image) {
        assets[item.image] = '';
      }
    });

    config.decks.forEach(deck => {
      // public image TODO: better check
      if (deck.image.includes('/')) {
        assets[deck.image] = deck.image;
      } else {
        assets[deck.image] = '';
      }
      deck.cards.forEach((card: CardOption | string) => {
        if (typeof card === 'string') {
          assets[card] = card;
        } else {
          assets[card.image] = '';
        }
      });
    });

    for (let key in assets) {
      if (!assets[key]) {
        assets[key] = loadAsset(`./games/${gameName}/images/${key}`);
      }
    }

    newGame(config, { assets, sendAssets: false }, game => {
      console.log(game.id);
      setNewGameId(game.id);
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

    for (let i = 0; i < gameNames.length; i++) {
      const gameName = gameNames[i];
      const config = window.require(`./games/${gameName}/config`) as GameConfig;
      configs[gameName] = config;
      console.log(config);
    }

    setGames(gameNames);
    setGameConfigs(configs);
  }, []);

  if (newGameId) {
    return <Redirect to={`/play/${newGameId}`} />;
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
