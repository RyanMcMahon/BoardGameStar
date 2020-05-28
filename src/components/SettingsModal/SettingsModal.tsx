import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { EditorState, Assets } from '../../types';
import { getGameById, addGame } from '../../utils/store';

interface Props {
  playerId: string;
  config: EditorState | undefined;
  assets: Assets;
  onClose: () => void;
}

export function SettingsModal(props: Props) {
  const { playerId, config, assets, onClose } = props;
  const [isLoadingSyncState, setIsLoadingSyncState] = React.useState(true);
  const [isSynced, setIsSynced] = React.useState(false);
  const handleSaveGame = async () => {
    if (!config) {
      return;
    }

    await addGame(config, assets);
    setIsSynced(true);
  };

  React.useEffect(() => {
    if (!config) {
      return;
    }

    const checkForExistingGame = async () => {
      const game = await getGameById(config.id);
      setIsSynced(!!game);
      setIsLoadingSyncState(false);
    };

    checkForExistingGame();
  }, [config]);

  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        <Modal.Title>Settings</Modal.Title>
        {!isLoadingSyncState && (
          <>
            {config?.disableSync || (config && config.playerId === playerId) ? (
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
