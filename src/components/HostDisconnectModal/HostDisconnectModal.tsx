import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';

interface Props {
  // onClose: () => void;
}

export function HostDisconnectModal(props: Props) {
  return (
    <Modal onClose={() => {}} hideCloseButton={true}>
      <Modal.Content>
        <Modal.Title>Host Disconnected</Modal.Title>
        The host has disconnected. <a href={`${window.location}`}>
          Refresh
        </a>{' '}
        when they've reconnected.
      </Modal.Content>
    </Modal>
  );
}
