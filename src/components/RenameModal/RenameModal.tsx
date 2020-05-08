import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

interface Props {
  onSave: (name: string) => void;
  onClose: () => void;
}

const Wrapper = styled.div({
  padding: '2rem',
});

export function RenameModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (inputRef.current) {
      props.onSave(inputRef.current.value);
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Wrapper>
        <form onSubmit={handleSubmit}>
          <input type="text" ref={inputRef} placeholder="Name" />
          <br />
          <Button design="primary" onClick={handleSubmit}>
            Save
          </Button>
        </form>
      </Wrapper>
    </Modal>
  );
}
