import React from 'react';
import Select from 'react-select';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { Game, GamePrompt } from '../../types';
import { PromptInputEditor } from '../PromptInputEditor';
import styled from 'styled-components';

interface Props {
  prompt: GamePrompt;
  onClose: () => void;
  onUpdate: (prompt: GamePrompt) => void;
}

export function EditPromptModal(props: Props) {
  const { onClose, onUpdate, prompt } = props;

  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        <Modal.Title>Edit Prompt</Modal.Title>
        <label>
          Title
          <br />
          <input
            type="text"
            value={prompt.title}
            onChange={e => {
              const title = e.currentTarget.value;
              onUpdate({
                ...prompt,
                title,
              });
            }}
          />
        </label>

        {prompt.inputs.map((input, index) => (
          <PromptInputEditor
            key={index}
            input={input}
            onDelete={() =>
              onUpdate({
                ...prompt,
                inputs: [
                  ...prompt.inputs.slice(0, index),
                  ...prompt.inputs.slice(index + 1),
                ],
              })
            }
            onUpdate={i =>
              onUpdate({
                ...prompt,
                inputs: [
                  ...prompt.inputs.slice(0, index),
                  i,
                  ...prompt.inputs.slice(index + 1),
                ],
              })
            }
          />
        ))}

        <Button
          design="primary"
          onClick={() =>
            onUpdate({
              ...prompt,
              inputs: [
                ...prompt.inputs,
                {
                  type: 'text',
                  label: '',
                },
              ],
            })
          }
        >
          Add Input
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
