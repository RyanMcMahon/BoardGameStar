import React from 'react';
import { Redirect } from 'react-router-dom';

import { createNewGame, Game } from '../../utils/game';
import { GameConfig } from '../../types';
import { Aviary } from '../../games/aviary';
import { Cards } from '../../games/cards';
import { Chess } from '../../games/chess';
import { Checkers } from '../../games/checkers';
import { WebPage, Content } from '../WebPage';
import { GameSelector } from '../GameSelector';

const configs: { [key: string]: GameConfig } = {
  Aviary: Aviary as any,
  Checkers: Checkers as any,
  Chess: Chess as any,
  Cards: Cards as any,
};

export function IncludedGames() {
  const [newGame, setNewGame] = React.useState<Game>();
  const handleGameSelect = (config: GameConfig) => {
    const assets: { [key: string]: string } = {};

    Object.values(config.pieces).forEach((piece: any) => {
      if (piece.image) {
        assets[piece.image] = piece.image;
      }
    });

    createNewGame(config, { assets, sendAssets: true }, game => {
      setNewGame(game);
    });
  };

  if (newGame) {
    return <Redirect to={`/play/${newGame.hostId}/${newGame.gameId}`} />;
  }

  return (
    <WebPage>
      <Content>
        {Object.entries(configs).map(([gameName, config], index) => (
          <GameSelector
            key={index}
            gameName={config.gameName}
            config={config}
            onGameSelect={handleGameSelect}
          />
        ))}
      </Content>
    </WebPage>
  );
}
