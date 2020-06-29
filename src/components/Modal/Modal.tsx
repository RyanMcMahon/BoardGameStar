import React from 'react';
import styled from 'styled-components';
import { theShadow } from '../../utils/style';

interface Props {
  zIndex?: number;
  children: React.ReactNode;
  onClose(): void;
}

interface ModalProps {
  zIndex: number;
}

const ModalOverlay = styled.div<ModalProps>((props: ModalProps) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: props.zIndex,
}));

const ModalWrapper = styled.div<ModalProps>((props: ModalProps) => ({
  maxHeight: 'calc(100% - 100px)',
  display: 'flex',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: '240px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  border: '1px solid rgba(0, 0, 0, 0.3)',
  boxShadow: theShadow,
  zIndex: props.zIndex,
}));

const ModalContent = styled.div({
  overflowY: 'auto',
});

const CloseButton = styled.span({
  position: 'absolute',
  top: '0px',
  right: '5px',
  color: '#888',
  ':hover': {
    color: '#444',
    cursor: 'pointer',
  },
});

const DEFAULT_ZINDEX = 9001;

export function Modal(props: Props) {
  return (
    <>
      <ModalOverlay
        onClick={props.onClose}
        zIndex={(props.zIndex || DEFAULT_ZINDEX) - 1}
      />
      <ModalWrapper zIndex={props.zIndex || DEFAULT_ZINDEX}>
        <CloseButton onClick={props.onClose}>&#10005;</CloseButton>
        <ModalContent>{props.children}</ModalContent>
      </ModalWrapper>
    </>
  );
}

Modal.Content = styled.div({
  padding: '2rem',
});

Modal.Title = styled.h5({
  fontSize: '3rem',
  margin: 0,
  padding: 0,
});
