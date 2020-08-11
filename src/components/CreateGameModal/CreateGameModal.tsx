import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { EditorConfig } from '../../types';
import styled from 'styled-components';

interface Props {
  onCreate: (name: string) => void;
  onClose: () => void;
}

const GameTips = styled.ul({
  // margin: 0,
  li: {
    margin: 0,
  },
});

export function CreateGameModal(props: Props) {
  const nameRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (!nameRef.current) {
      return;
    }

    const name = nameRef.current.value.trim();
    props.onCreate(name);
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Create Game</Modal.Title>
        <form onSubmit={handleSubmit}>
          <label>
            Game Name
            <br />
            <input type="text" ref={nameRef} placeholder="Name" />
          </label>
          <strong>Game Tips</strong>
          <GameTips>
            <li>Keep image sizes small (Max 1mb)</li>
            <li>Card / Piece recommended size &lt;20kb</li>
            <li>Replace images with tokens where possible</li>
            <li>Avoid in-game player aids</li>
            <li>Filenames must be unique</li>
          </GameTips>
          <Button design="success" onClick={handleSubmit}>
            Create
          </Button>
        </form>
      </Modal.Content>
    </Modal>
  );
}
