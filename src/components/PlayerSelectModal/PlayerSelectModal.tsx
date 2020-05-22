import React from 'react';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { PlayerPiece } from '../../types';
import styled from 'styled-components';

interface Props {
  onSelect: (id: string) => void;
  onClose: () => void;
  players: PlayerPiece[];
}

const PlayerRow = styled.div({
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '2rem',
  margin: '0 0 .5rem',
  ':hover': {
    opacity: 0.6,
  },
});

export function PlayerSelectModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Select Player</Modal.Title>
        {props.players.length === 0 && <>No Other Players</>}
        {props.players.map(
          player =>
            player.playerId && (
              <PlayerRow
                style={{ color: player.color }}
                onClick={() => props.onSelect(player.playerId || '')}
              >
                {player.name}
              </PlayerRow>
            )
        )}
      </Modal.Content>
    </Modal>
  );
}
