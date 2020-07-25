import React from 'react';
import Select from 'react-select';

import { Button } from '../../utils/style';
import { publishGame, getCurrentUser } from '../../utils/api';
import { Modal } from '../Modal';
import { Game, PublicGame, PublishableGame } from '../../types';
import { filePrompt } from '../../utils/assets';
import { UploadFile } from 'electron';
import { FaTrash } from 'react-icons/fa';

interface Props {
  game?: any;
  config: Game;
  onClose: () => void;
}

const tags = ['RPG', 'Hidden Role', 'Hidden Movement'];

export function PublishModal(props: Props) {
  const cleanConfig: PublishableGame = {
    ...props.config,
    store: 'browser',
    userId: getCurrentUser()?.uid!,
    disableSync: true,
    files: [],
    price: 0,
  };
  const loadAssets = props.config.loadAssets || (() => ({}));
  // delete cleanConfig.assets;
  delete cleanConfig.loadAssets;
  const [game, setGame] = React.useState<PublishableGame>(cleanConfig);

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

        <label>
          Price
          <input
            type="number"
            min="0"
            value={game.price}
            onChange={e => {
              const price = parseFloat(e.currentTarget.value);
              setGame(f => ({ ...f, price }));
            }}
          />
        </label>

        <label>
          Banner (1600 x 400)
          <div
            onClick={async () => {
              const [file] = await filePrompt({ multiple: false });
              setGame(f => ({ ...f, banner: file.content }));
            }}
          >
            {game.banner ? (
              <img src={game.banner} height="200" width="200" />
            ) : (
              <Button design="primary">Upload</Button>
            )}
          </div>
        </label>

        <label>Additional Files</label>
        {game.files.map(file => (
          <div>
            <FaTrash
              onClick={() => {
                const files = game.files.filter(f => f.name !== file.name);
                setGame(f => ({ ...f, files }));
              }}
            />
            {file.name}
          </div>
        ))}
        <Button
          design="primary"
          onClick={async () => {
            const files = await filePrompt();
            setGame(f => ({ ...f, files: [...game.files, ...files] }));
          }}
        >
          Upload
        </Button>

        <Button design="success" onClick={handleSubmit}>
          Publish
        </Button>
      </Modal.Content>
    </Modal>
  );
}