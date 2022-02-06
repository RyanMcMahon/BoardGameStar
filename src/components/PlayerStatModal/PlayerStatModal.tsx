import React from 'react';
import * as _ from 'lodash';
import styled from 'styled-components';
import slug from 'slugid';

import { Button, ButtonGroup } from '../../utils/style';
import { Modal } from '../Modal';
import { CardEditor } from '../CardEditor';
import {
  EditorAction,
  EditorState,
  Assets,
  CardPiece,
  AnyPieceOption,
  DeckPiece,
  PlayerStatGroup,
  PlayerStatConfig,
  PlayerSelectConfig,
  PlayerAttrConfig,
  Pieces,
} from '../../types';
import { getAssetDimensions, filePrompt } from '../../utils/assets';
import { values } from 'lodash';
import { GameStatePlayer } from '../../utils/gameState';

interface Props {
  onClose: () => void;
  pieces: Pieces;
  players?: { [id: string]: GameStatePlayer };
  groups?: PlayerStatGroup[];
  onUpdateStat: (update: {
    targetPlayerId: string;
    statId: string;
    value: string;
  }) => void;
}

const StatsWrapper = styled.div({
  display: 'flex',
  flexDirection: 'row',
  width: '845px',
  // flexWrap: 'wrap',
  overflowY: 'scroll',
  height: '600px',
});

const GroupWrapper = styled.div({
  marginBottom: '16px',
  paddingLeft: '16px',
});

export function PlayerStatModal(props: Props) {
  const { pieces, groups = [], players = {}, onUpdateStat } = props;
  const sortedPlayers = _.sortBy(players, 'name');
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Player Stats Editor</Modal.Title>
        <StatsWrapper>
          {sortedPlayers.map((player) => (
            <div key={player.id}>
              <h1>{player.name}</h1>
              {groups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h4>{group.label}</h4>

                  <GroupWrapper>
                    {group.stats.map((stat, statIndex) => (
                      <div key={statIndex}>
                        <label>{stat.label}</label>
                        {stat.type === 'attr' && (
                          <div>
                            <select
                              value={player.stats[stat.id] || undefined}
                              onChange={(e) => {
                                const v = e.target.value;
                                onUpdateStat({
                                  targetPlayerId: player.id,
                                  statId: stat.id,
                                  value: v,
                                });
                              }}
                            >
                              {stat.values.map((value) => (
                                <option
                                  key={value.id}
                                  value={value.id || undefined}
                                >
                                  {value.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={
                                player.stats[stat.id + '_mod'] || undefined
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                onUpdateStat({
                                  targetPlayerId: player.id,
                                  statId: stat.id + '_mod',
                                  value: v,
                                });
                              }}
                            >
                              {(stat.modifiers || []).map((mod) => (
                                <option
                                  key={mod.id}
                                  value={mod.id || undefined}
                                >
                                  {mod.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {stat.type === 'select' && (
                          <div>
                            <select
                              value={player.stats[stat.id] || undefined}
                              onChange={(e) => {
                                const v = e.target.value;
                                onUpdateStat({
                                  targetPlayerId: player.id,
                                  statId: stat.id,
                                  value: v,
                                });
                              }}
                            >
                              {stat.values.map((value) => (
                                <option
                                  key={value.id}
                                  value={value.id || undefined}
                                >
                                  {value.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </GroupWrapper>
                </div>
              ))}
            </div>
          ))}
        </StatsWrapper>
      </Modal.Content>
    </Modal>
  );
}
