import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { isWebBuild } from '../../utils/meta';

interface Props {
  gameId: string;
  hostId: string;
  onClose: () => void;
}

const InviteHeader = styled.h5({
  margin: '1rem 0 0',
});

export function InviteModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <InviteHeader>Host ID:</InviteHeader>
        {props.hostId}
        <InviteHeader>Game ID:</InviteHeader>
        {props.gameId}
        {isWebBuild && (
          <>
            <InviteHeader>Invite Link:</InviteHeader>
            <input
              type="text"
              className="u-full-width"
              value={`${window.location}`}
            />
          </>
        )}
      </Modal.Content>
    </Modal>
  );
}
