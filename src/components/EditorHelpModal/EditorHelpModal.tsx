import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

interface Props {
  onClose: () => void;
}

export function EditorHelpModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Editor Help</Modal.Title>
        [TODO]
      </Modal.Content>
    </Modal>
  );
}
