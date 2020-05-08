import React from 'react';
import { newGame } from '../../utils/game';
import { Redirect } from 'react-router-dom';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { CardOption, GameConfig } from '../../types';
import { GameSelector } from '../GameSelector';
import { WebPage, Content } from '../WebPage';

const fs = window.require('fs');

export function CustomGame() {
  const [games, setGames] = React.useState<any>([]);
  const [gameConfigs, setGameConfigs] = React.useState<any>({});
  const [isLoadingGames, setIsLoadingGames] = React.useState<boolean>(false);
  const [newGameId, setNewGameId] = React.useState<string>();
  const handleGameSelect = (config: GameConfig) => () => {
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
        assets[key] = `data:image/png;base64,${fs
          .readFileSync('./games/Condottiere/images/' + key)
          .toString('base64')}`;
      }
    }

    newGame(config, { assets, sendAssets: false }, game => {
      console.log(game.id);
      setNewGameId(game.id);
    });
  };

  React.useEffect(() => {
    setIsLoadingGames(true);
    const loadGames = async () => {
      const gameNames = fs.statSync('./games').isDirectory()
        ? fs.readdirSync('./games').filter((x: string) => x !== '.gitkeep')
        : [];
      const configs: any = {};

      for (let i = 0; i < gameNames.length; i++) {
        const gameName = gameNames[i];
        const config = window.require(
          `./games/${gameName}/config`
        ) as GameConfig;
        configs[gameName] = config;
        console.log(config);
      }

      setGames(gameNames);
      setGameConfigs(configs);
      setIsLoadingGames(false);
    };
    loadGames();
  }, []);

  if (newGameId) {
    return <Redirect to={`/play/${newGameId}`} />;
  }

  return (
    <WebPage>
      <Content>
        {isLoadingGames ? (
          <ProgressBar complete={60} />
        ) : (
          <>
            {games.map((game: any) => (
              <GameSelector
                gameName={game}
                config={gameConfigs[game]}
                onGameSelect={handleGameSelect(gameConfigs[game])}
              />
            ))}
            {!games.length && <h1>No Custom Games</h1>}
          </>
        )}
      </Content>
    </WebPage>
  );
}

export default CustomGame;
