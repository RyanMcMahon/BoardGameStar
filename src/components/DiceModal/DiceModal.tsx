import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { DiceSet } from '../../types';

interface Props {
  onRollDice: (dice: DiceSet, hidden: boolean) => void;
  onClose: () => void;
}

const DiceEditor = styled.div({
  input: {
    marginBottom: '.5rem',
  },
});

export function DiceModal(props: Props) {
  const [dice, setDice] = React.useState<DiceSet>({
    4: 0,
    6: 0,
    8: 0,
    10: 0,
    12: 0,
    20: 0,
  });

  const handleUpdateDice = (num: number) => (count: number) => {
    setDice(d => ({
      ...d,
      [num]: count,
    }));
  };

  const handleRoll = (hidden: boolean) => () => {
    props.onRollDice(dice, hidden);
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Roll Dice</Modal.Title>

        {[4, 6, 8, 10, 12, 20].map(faces => (
          <DiceEditor key={faces}>
            D{faces}
            <input
              type="number"
              className="u-full-width"
              min={0}
              defaultValue={dice[faces]}
              onChange={e =>
                handleUpdateDice(faces)(parseInt(e.currentTarget.value, 10))
              }
            />
          </DiceEditor>
        ))}

        <Button design="primary" block={true} onClick={handleRoll(false)}>
          Roll
        </Button>

        {/* <Button design="primary" block={true} onClick={handleRoll(true)}>
          Roll (Hidden)
        </Button> */}
      </Modal.Content>
    </Modal>
  );
}
