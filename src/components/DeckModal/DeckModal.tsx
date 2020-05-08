import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';

interface Props {
  onDrawCards: (count: number) => void;
  onClose: () => void;
}

const Wrapper = styled.div({
  padding: '2rem',
});

export function DeckModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (inputRef.current) {
      props.onDrawCards(parseInt(inputRef.current.value, 10));
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Wrapper>
        <form onSubmit={handleSubmit}>
          <input ref={inputRef} type="number" placeholder="Draw Cards" />
          <br />
          <Button design="primary" onClick={handleSubmit}>
            Draw
          </Button>
        </form>
      </Wrapper>
    </Modal>
  );
}
