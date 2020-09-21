import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';

interface Props {
  onClose: () => void;
}

export function ZoomWarningModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Browser Zoom Changed</Modal.Title>
        Board Game Star is best played with the default zoom. Please reset your
        browser zoom level.
        <br />
        <br />
        Tip: Change the boards zoom level with the mouse's scroll wheel or
        two-finger scroll on trackpad.
      </Modal.Content>
    </Modal>
  );
}
