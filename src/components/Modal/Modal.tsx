import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
  onClose(): void;
}

const ModalOverlay = styled.div({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 9998,
});

const ModalWrapper = styled.div({
  maxHeight: 'calc(100% - 100px)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: '240px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  border: '1px solid rgba(0, 0, 0, 0.3)',
  boxShadow: '0px 3px 7px rgba(0, 0, 0, 0.3)',
  zIndex: 9999,
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

export function Modal(props: Props) {
  return (
    <>
      <ModalOverlay onClick={props.onClose} />
      <ModalWrapper>
        <CloseButton onClick={props.onClose}>&#10005;</CloseButton>
        {props.children}
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
