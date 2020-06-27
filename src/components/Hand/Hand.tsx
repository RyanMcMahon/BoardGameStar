import React from 'react';
import styled from 'styled-components';

import { DropdownButton } from '../DropdownButton';
import { PlayerSelectModal } from '../PlayerSelectModal';
import { Button } from '../../utils/style';
import { Card, Pieces, PlayerPiece } from '../../types';
import { prependPrefix } from '../../utils/assets';

const HandWrapper = styled.div({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});

const Controls = styled.div({
  padding: '1rem',
  '> button:nth-child(n+2)': {
    marginLeft: '1rem',
  },
});

const CardWrapper = styled.div({
  padding: '.5rem',
  overflowY: 'scroll',
  flex: 1,
});

const CardImage = styled.img({
  margin: '.5rem',
});

interface Props {
  assets: { [key: string]: string };
  pieces: Pieces;
  hand: string[];
  playCards: (ids: string[], faceDown: boolean) => void;
  passCards: (ids: string[], playerId: string) => void;
  players: PlayerPiece[];
  discard: (ids: string[]) => void;
}

function sortCards(a: Card, b: Card) {
  if (!a || !b) {
    return 1;
  }
  if (a.image !== b.image) {
    return (a.image || '') > (b.image || '') ? 1 : -1;
  }
  return a.id > b.id ? 1 : -1;
}

export function Hand(props: Props): JSX.Element {
  const [showPlayerSelectModal, setShowPlayerSelectModal] = React.useState(
    false
  );
  const [selectedCards, setSelectedCards] = React.useState<string[]>([]);

  const handleSelectCard = (id: string) => () => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handlePlayCardsFaceUp = () => {
    props.playCards(selectedCards, false);
    setSelectedCards([]);
  };

  const handlePlayCardsFaceDown = () => {
    props.playCards(selectedCards, true);
    setSelectedCards([]);
  };

  const handlePassCards = (playerId: string) => {
    props.passCards(selectedCards, playerId);
    setSelectedCards([]);
    setShowPlayerSelectModal(false);
  };

  const handleDiscard = () => {
    props.discard(selectedCards);
    setSelectedCards([]);
  };

  return (
    <>
      <HandWrapper>
        <Controls>
          <DropdownButton
            items={[
              {
                label: 'Play Face Down',
                fn: handlePlayCardsFaceDown,
              },
              {
                label: 'Pass to Player',
                fn: () => setShowPlayerSelectModal(true),
              },
            ]}
            disabled={!selectedCards.length}
          >
            <Button
              design="primary"
              onClick={handlePlayCardsFaceUp}
              disabled={!selectedCards.length}
            >
              Play
            </Button>
          </DropdownButton>
          <Button
            design="primary"
            onClick={handleDiscard}
            disabled={!selectedCards.length}
          >
            discard
          </Button>
        </Controls>
        <CardWrapper>
          {props.hand
            .map(id => props.pieces[id] as Card)
            .filter(x => x)
            .sort(sortCards)
            .map(
              card =>
                card.image && (
                  <CardImage
                    key={card.id}
                    src={prependPrefix(props.assets[card.image])}
                    alt=""
                    width="125"
                    onClick={handleSelectCard(card.id)}
                    style={{
                      opacity: selectedCards.includes(card.id) ? 0.6 : 1,
                    }}
                  />
                )
            )}
        </CardWrapper>
      </HandWrapper>
      {showPlayerSelectModal && (
        <PlayerSelectModal
          players={props.players}
          onSelect={handlePassCards}
          onClose={() => setShowPlayerSelectModal(false)}
        />
      )}
    </>
  );
}
