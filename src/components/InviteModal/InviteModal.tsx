import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { isWebBuild } from '../../utils/meta';

interface Props {
  gameId: string;
  onClose: () => void;
}

const Wrapper = styled.div({
  padding: '2rem',
});

const InviteHeader = styled.h5({
  margin: '1rem 0 0',
});

export function InviteModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Wrapper>
        <InviteHeader>Game ID:</InviteHeader>
        {props.gameId}
        {isWebBuild && (
          <>
            <InviteHeader>Invite Link:</InviteHeader>
            {`${window.location}`}
          </>
        )}
      </Wrapper>
    </Modal>
  );
}
