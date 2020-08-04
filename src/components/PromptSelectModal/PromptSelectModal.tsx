import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { GamePrompt, PlayerPiece } from '../../types';
import { Button } from '../../utils/style';

interface Props {
  prompts: GamePrompt[];
  players: PlayerPiece[];
  onSelectPrompt: (prompt: GamePrompt, players: string[]) => void;
  onClose: () => void;
}

const Table = styled.table({
  width: '100%',
  '[type="checkbox"]': {
    position: 'relative',
    top: '8px',
  },
});

export function PromptSelectModal(props: Props) {
  const { prompts, players, onClose, onSelectPrompt } = props;
  const [form, setForm] = React.useState<{
    prompt: GamePrompt;
    players: string[];
  }>({ prompt: prompts[0], players: [] });
  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        <Modal.Title>Prompt Players</Modal.Title>

        <select
          className="u-full-width"
          onChange={e => {
            const index = parseInt(e.currentTarget.value, 10);
            setForm(f => ({
              ...f,
              prompt: prompts[index],
            }));
          }}
        >
          {prompts.map((prompt: GamePrompt, index) => (
            <option key={index} value={index}>
              {prompt.title}
            </option>
          ))}
        </select>

        <Table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={e => {
                    const checked = e.currentTarget.checked;
                    setForm(f => ({
                      ...f,
                      players: checked
                        ? players.map(p => p.playerId || '')
                        : [],
                    }));
                  }}
                />
              </th>
              <th>Player</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.playerId}>
                <td>
                  <input
                    type="checkbox"
                    checked={form.players.includes(player.playerId || '')}
                    onChange={e => {
                      const checked = e.currentTarget.checked;
                      setForm(f => ({
                        ...f,
                        players: checked
                          ? [...f.players, player.playerId || '']
                          : f.players.filter(id => id !== player.playerId),
                      }));
                    }}
                  />
                </td>
                <td>{player.name}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Button
          design="success"
          block={true}
          onClick={() => onSelectPrompt(form.prompt, form.players)}
        >
          Prompt Players
        </Button>
      </Modal.Content>
    </Modal>
  );
}
