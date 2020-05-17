import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { EditorConfig } from '../../types';

interface Props {
  onCreate: (editorConfig: EditorConfig) => void;
  onClose: () => void;
}

export function CreateGameModal(props: Props) {
  const nameRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (!nameRef.current) {
      return;
    }

    const gameName = nameRef.current.value.trim();
    props.onCreate({
      gameName,
    });
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Create Game</Modal.Title>
        <form onSubmit={handleSubmit}>
          <label>Game Name</label>
          <input type="text" ref={nameRef} placeholder="Name" />
          <br />
          <Button design="success" onClick={handleSubmit}>
            Create
          </Button>
        </form>
      </Modal.Content>
    </Modal>
  );
}
