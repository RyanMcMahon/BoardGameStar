import React, { Children } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { GameState, SaveGame, createGameConn } from '../../utils/game';
import { getGameById, loadAssets } from '../../utils/store';
import { getHostId } from '../../utils/identity';

interface Props {
  children: Array<JSX.Element | boolean>;
}

export function ResumeGame(props: Props) {
  const { children } = props;
  const [checkedForGame, setCheckedForGame] = React.useState(false);
  const [resuming, setResuming] = React.useState(false);
  const match = useRouteMatch<{ gameId: string; hostId: string }>(
    '/play/:hostId/:gameId'
  );

  const resumeGame = async (instanceId: string, gameState: GameState) => {
    setResuming(true);

    const gameId = gameState.game.id;
    const game = await getGameById(gameId);
    if (!game) {
      return;
    }

    const assets = await loadAssets(gameId);
    await createGameConn({
      game: game.config,
      hostId: getHostId(),
      gameId: instanceId,
      initialState: gameState,
      options: { assets, sendAssets: false },
      cb: () => {
        setResuming(false);
      },
    });
  };

  if (!checkedForGame) {
    setCheckedForGame(true);
    if (match) {
      const saveGame = localStorage.getItem('gameState');
      if (saveGame) {
        const { gameId, gameState } = JSON.parse(saveGame) as SaveGame;
        if (match.params.gameId === gameId) {
          resumeGame(gameId, gameState);
          return null;
        }
      }
    }
  }

  if (resuming) {
    // TODO show resuming game screen
    return <></>;
  }

  return <>{children}</>;
}
