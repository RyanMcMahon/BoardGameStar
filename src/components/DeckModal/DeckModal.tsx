import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

interface Props {
  onDrawCards: (count: number) => void;
  onPlayFaceUp: (count: number) => void;
  onPlayFaceDown: (count: number) => void;
  onClose: () => void;
}

const Wrapper = styled.div({
  input: {
    marginBottom: '.5rem',
  },
});

export function DeckModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();

  const handleSubmit = () => {
    if (inputRef.current) {
      props.onDrawCards(parseInt(inputRef.current.value, 10));
    }
  };

  const handlePlayFaceUp = () => {
    if (inputRef.current) {
      props.onPlayFaceUp(parseInt(inputRef.current.value, 10));
    }
  };

  const handlePlayFaceDown = () => {
    if (inputRef.current) {
      props.onPlayFaceDown(parseInt(inputRef.current.value, 10));
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Draw Cards</Modal.Title>
        <Wrapper>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="number"
              className="u-full-width"
              min={1}
              defaultValue={1}
              placeholder="Number"
            />
            <Button block={true} design="success" onClick={handleSubmit}>
              Draw
            </Button>
          </form>
          <Button block={true} design="primary" onClick={handlePlayFaceUp}>
            Play Face Up
          </Button>
          <Button block={true} design="primary" onClick={handlePlayFaceDown}>
            Play Face Down
          </Button>
        </Wrapper>
      </Modal.Content>
    </Modal>
  );
}
