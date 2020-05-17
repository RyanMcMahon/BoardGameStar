import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

interface Props {
  onDrawCards: (count: number) => void;
  onClose: () => void;
}

export function DeckModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (inputRef.current) {
      props.onDrawCards(parseInt(inputRef.current.value, 10));
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Draw Cards</Modal.Title>
        <form onSubmit={handleSubmit}>
          <input ref={inputRef} type="number" placeholder="Number" />
          <br />
          <Button design="success" onClick={handleSubmit}>
            Draw
          </Button>
        </form>
      </Modal.Content>
    </Modal>
  );
}
