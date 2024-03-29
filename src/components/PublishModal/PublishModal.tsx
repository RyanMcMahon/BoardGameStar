import React from 'react';

import { Button } from '../../utils/style';
import { publishGame, getCurrentUser } from '../../utils/api';
import { Modal } from '../Modal';
import { Game, PublishableGame } from '../../types';
import { filePrompt } from '../../utils/assets';
import { useNavigate } from 'react-router-dom';
import { useWebContext } from '../../utils/WebContext';

interface Props {
  game?: any;
  config: Game;
  onClose: () => void;
}

// const tags = ['RPG', 'Hidden Role', 'Hidden Movement'];

export function PublishModal(props: Props) {
  const { alertError } = useWebContext();
  const cleanConfig: PublishableGame = {
    ...props.config,
    store: 'browser',
    userId: getCurrentUser()?.uid!,
    disableSync: true,
    files: [],
    price: 0,
  };
  const loadAssets = props.config.loadAssets || (() => ({}));
  delete cleanConfig.loadAssets;
  const [game, setGame] = React.useState<PublishableGame>(cleanConfig);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const assets = await loadAssets();
      setIsPublishing(true);
      await publishGame(game, assets);
      navigate(`/games/${cleanConfig.id}`);
    } catch (err) {
      alertError(`Error publishing game. ${err}`);
      setIsPublishing(false);
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Publish {props.config.name}</Modal.Title>

        {/* <label>
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
        </label> */}

        <label>
          Banner (1600 x 400)
          <div
            onClick={async () => {
              const [file] = await filePrompt({ multiple: false });
              setGame(f => ({ ...f, banner: file.content }));
            }}
          >
            {game.banner ? (
              <img alt="banner" src={game.banner} height="200" width="200" />
            ) : (
              <Button design="primary">Upload</Button>
            )}
          </div>
        </label>

        {/* <label>Additional Files</label>
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
        <br />
*/}
        <br />

        <Button design="success" onClick={handleSubmit} disabled={isPublishing}>
          Publish
        </Button>
      </Modal.Content>
    </Modal>
  );
}
