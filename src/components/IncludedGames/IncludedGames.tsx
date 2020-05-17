import React from 'react';
import { Redirect } from 'react-router-dom';

import { newGame } from '../../utils/game';
import { CardOption, Config, GameConfig } from '../../types';
import { Aviary } from '../../games/aviary';
import { WebPage, Content } from '../WebPage';
import { GameSelector } from '../GameSelector';

const configs: { [key: string]: Config } = {
  'Aviary (Compare with Arboretum)': Aviary,
};

export function IncludedGames() {
  const [newGameId, setNewGameId] = React.useState<string>();
  const handleGameSelect = (config: GameConfig) => {
    console.log(config);
    const assets: { [key: string]: string } = {};

    config.board.forEach(piece => {
      if (piece.image) {
        assets[piece.image] = piece.image;
      }
    });

    config.decks.forEach(deck => {
      assets[deck.image] = deck.image;
      deck.cards.forEach((card: CardOption | string) => {
        if (typeof card === 'string') {
          assets[card] = card;
        }
      });
    });

    newGame(config, { assets, sendAssets: true }, game => {
      console.log(game.id);
      setNewGameId(game.id);
    });
  };

  if (newGameId) {
    return <Redirect to={`/play/${newGameId}`} />;
  }

  return (
    <WebPage>
      <Content>
        {Object.entries(configs).map(([gameName, config], index) => (
          <GameSelector
            key={index}
            gameName={gameName}
            config={config}
            onGameSelect={handleGameSelect}
          />
        ))}
      </Content>
    </WebPage>
  );
}
