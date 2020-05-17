import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

interface Props {
  onSave: (name: string) => void;
  onClose: () => void;
}

export function RenameModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (inputRef.current) {
      props.onSave(inputRef.current.value);
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Player Name</Modal.Title>
        <form onSubmit={handleSubmit}>
          <input type="text" ref={inputRef} placeholder="Name" />
          <br />
          <Button design="success" onClick={handleSubmit}>
            Save
          </Button>
        </form>
      </Modal.Content>
    </Modal>
  );
}
