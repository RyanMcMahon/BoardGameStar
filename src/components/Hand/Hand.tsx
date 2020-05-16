import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Card } from '../../types';
import { imagePrefix } from '../../utils/meta';

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
  hand: Card[];
  playCards: (ids: string[]) => void;
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
  const [selectedCards, setSelectedCards] = React.useState<string[]>([]);

  const handleSelectCard = (id: string) => () => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handlePlayCards = () => {
    props.playCards(selectedCards);
    setSelectedCards([]);
  };

  const handleDiscard = () => {
    props.discard(selectedCards);
    setSelectedCards([]);
  };

  return (
    <HandWrapper>
      <Controls>
        <Button
          design="primary"
          onClick={handlePlayCards}
          disabled={!selectedCards.length}
        >
          Play
        </Button>
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
          .filter(x => x)
          .sort(sortCards)
          .map(
            card =>
              card.image && (
                <CardImage
                  key={card.id}
                  src={props.assets[card.image]}
                  alt=""
                  width="150"
                  onClick={handleSelectCard(card.id)}
                  style={{
                    opacity: selectedCards.includes(card.id) ? 0.6 : 1,
                  }}
                />
              )
          )}
      </CardWrapper>
    </HandWrapper>
  );
}
