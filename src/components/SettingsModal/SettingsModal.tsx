import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { Assets, Game } from '../../types';
import { getGameById, addGame } from '../../utils/store';

interface Props {
  playerId: string;
  config: Game | undefined;
  assets: Assets;
  onClose: () => void;
}

export function SettingsModal(props: Props) {
  const { config: game, assets, onClose } = props;
  const [isLoadingSyncState, setIsLoadingSyncState] = React.useState(true);
  const [isSynced, setIsSynced] = React.useState(false);
  const handleSaveGame = async () => {
    if (!game) {
      return;
    }

    await addGame(game, assets);
    setIsSynced(true);
  };

  React.useEffect(() => {
    if (!game) {
      return;
    }

    const checkForExistingGame = async () => {
      const existingGame = await getGameById(game.id);
      setIsSynced(!!existingGame);
      setIsLoadingSyncState(false);
    };

    checkForExistingGame();
  }, [game]);

  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        <Modal.Title>Settings</Modal.Title>
        {!isLoadingSyncState && (
          <>
            {game?.disableSync /*|| (game && game.playerId === playerId)*/ ? (
              <p>Sync is disabled for this game</p>
            ) : (
              <>
                {isSynced ? (
                  <p>Game Synced</p>
                ) : (
                  <Button design="primary" onClick={handleSaveGame}>
                    Sync Game To Device
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </Modal.Content>
    </Modal>
  );
}
