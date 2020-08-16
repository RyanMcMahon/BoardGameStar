import React from 'react';

// import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { Pieces, CardPiece, Assets } from '../../types';
import { prependPrefix } from '../../utils/assets';
import styled from 'styled-components';

interface Props {
  pieces: Pieces;
  assets: Assets;
  cards: string[];
  discarded: string[];
  onTakeCards: (cardIds: string[]) => void;
  onClose: () => void;
}

// const CardWrapper = styled.div({
//   padding: '.5rem',
//   overflowY: 'scroll',
//   flex: 1,
// });

const CardImage = styled.img({
  // margin: '.5rem',
  maxWidth: '200px',
});

export function DeckPeekModal(props: Props) {
  const { assets, pieces, cards, discarded, onTakeCards, onClose } = props;
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        {/* <Button design="success" onClick={() => {}}>
          Remove From Game
        </Button> */}
        {/* <Button design="success" onClick={() => {}}>
          Draw
        </Button> */}
        <Modal.Title>Peeking</Modal.Title>
        {cards
          .map(cardId => pieces[cardId] as CardPiece)
          .map(card => (
            <CardImage
              key={card.id}
              src={prependPrefix(assets[card.image])}
              alt=""
              // width="150"
              // onClick={handleSelectCard(card.id)}
              // style={{
              //   opacity: selectedCards.includes(card.id) ? 0.6 : 1,
              // }}
            />
          ))}
        {/* [TODO]
        <Modal.Title>Discarded</Modal.Title> */}
      </Modal.Content>
    </Modal>
  );
}
