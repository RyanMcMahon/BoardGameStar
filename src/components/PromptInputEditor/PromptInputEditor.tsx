import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { CardPiece, Assets, GamePromptInput } from '../../types';
import { useAsset } from '../../utils/useAsset';
import { FaTrash } from 'react-icons/fa';

interface Props {
  input: GamePromptInput;
  onDelete: () => void;
  onUpdate: (input: GamePromptInput) => void;
}

const Wrapper = styled.div({
  '> *': {
    display: 'inline-block',
  },
  '> *:nth-child(n+2)': {
    marginLeft: '1rem',
  },
  [Button]: {
    position: 'relative',
    top: '-2px',
  },
});

// const Img = styled.img({
//   width: 200,
//   height: 200,
// });

export function PromptInputEditor(props: Props) {
  const { input, onDelete, onUpdate } = props;

  return (
    <Wrapper>
      <label>
        Label
        <br />
        <input
          type="text"
          value={input.label}
          onChange={e => {
            const label = e.currentTarget.value;
            onUpdate({
              ...input,
              label,
            });
          }}
        />
      </label>

      <label>
        Type
        <br />
        <select
          onChange={e => {
            const type = e.currentTarget.value;
            onUpdate({
              ...input,
              type: type as any,
            });
          }}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="hand">Card From Hand</option>
        </select>
      </label>

      <Button design="danger" onClick={onDelete}>
        <FaTrash />
      </Button>
    </Wrapper>
  );
}
