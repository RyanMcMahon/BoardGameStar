import React from 'react';
import Select from 'react-select';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { Game } from '../../types';
import { TagSelect } from '../TagSelect';
import { filePrompt } from '../../utils/assets';

interface Props {
  game: Partial<Game>;
  onClose: () => void;
  onUpdate: (game: Partial<Game>) => void;
}

const tags = ['RPG', 'Hidden Role', 'Hidden Movement'];

export function EditGameModal(props: Props) {
  const { game, onClose, onUpdate } = props;

  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        {/* <Modal.Title>{props.config.name}</Modal.Title> */}
        <label>
          Name
          <br />
          <input
            type="text"
            value={game.name}
            onChange={e => {
              const name = e.currentTarget.value;
              onUpdate({
                name,
              });
            }}
          />
        </label>

        <label>Image</label>
        <div
          onClick={async () => {
            const [file] = await filePrompt({ multiple: false });
            const thumbnail = file.content;
            onUpdate({ thumbnail });
          }}
        >
          {game.thumbnail ? (
            <img src={game.thumbnail as string} height="200" width="200" />
          ) : (
            <Button design="primary">Upload Image</Button>
          )}
        </div>

        <label>
          Tags
          <TagSelect
            tags={game.tags || []}
            onUpdate={tags => onUpdate({ tags })}
          />
        </label>

        <label>Summary</label>
        <textarea
          value={game.summary}
          onChange={e => {
            const summary = e.currentTarget.value;
            onUpdate({ summary });
          }}
        />

        <label>Description (markdown)</label>
        <textarea
          value={game.description}
          onChange={e => {
            const description = e.currentTarget.value;
            onUpdate({ description });
          }}
        />

        <label>Rules PDF</label>
        <Button
          design="primary"
          onClick={async () => {
            const [file] = await filePrompt({ multiple: false });
            // const filename = file.name;
            const rules = file.content;
            debugger;
            onUpdate({ rules });
          }}
        >
          Upload
        </Button>
        <br />
        <br />

        <Button design="success" onClick={onClose}>
          Done
        </Button>
      </Modal.Content>
    </Modal>
  );
}
