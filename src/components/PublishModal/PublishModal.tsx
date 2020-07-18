import React from 'react';

import { Button } from '../../utils/style';
import { publishGame, getCurrentUser } from '../../utils/server';
import { Modal } from '../Modal';
import { Game } from '../../types';

interface Props {
  game?: any;
  config: Game;
  onClose: () => void;
}

export function PublishModal(props: Props) {
  const cleanConfig = {
    ...props.config,
    userId: getCurrentUser()?.uid,
  };
  const loadAssets = props.config.loadAssets || (() => ({}));
  // delete cleanConfig.assets;
  delete cleanConfig.loadAssets;
  const [game, setGame] = React.useState<Game>(cleanConfig);

  const handleSubmit = async () => {
    try {
      const assets = loadAssets();
      // const game = {
      //   ...form,
      //   assets: Object.keys(assets),
      // };
      await publishGame(game, assets);
    } catch (err) {
      debugger;
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Publish {props.config.name}</Modal.Title>
        <textarea
          value={game.description}
          onChange={e => {
            const description = e.currentTarget.value;
            setGame(f => ({ ...f, description }));
          }}
        />
        <Button design="success" onClick={handleSubmit}>
          Publish
        </Button>
      </Modal.Content>
    </Modal>
  );
}
