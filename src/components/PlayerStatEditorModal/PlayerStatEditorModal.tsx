import React from 'react';
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
  PlayerInputConfig,
} from '../../types';
import { getAssetDimensions, filePrompt } from '../../utils/assets';
import { values } from 'lodash';

interface Props {
  onClose: () => void;
  dispatch: React.Dispatch<EditorAction>;
  state: EditorState;
}

const StatsWrapper = styled.div({
  // display: 'flex',
  width: '845px',
  // flexWrap: 'wrap',
  overflowY: 'scroll',
  height: '600px',
});

const GroupWrapper = styled.div({
  marginBottom: '16px',
  paddingLeft: '16px',
});

export function PlayerStatEditorModal(props: Props) {
  const { state, dispatch } = props;
  console.log(state.playerStats);
  const { playerStats = [] } = state;
  const groups = playerStats;

  const handleAddGroup = async () => {
    dispatch({
      type: 'update_player_stat_config',
      playerStats: [
        ...groups,
        {
          label: 'New Group',
          stats: [],
        },
      ],
    });
  };
  const handleUpdateStats = async (playerStats: PlayerStatGroup[]) => {
    dispatch({
      type: 'update_player_stat_config',
      playerStats,
    });
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Player Stats Editor</Modal.Title>
        <StatsWrapper>
          {groups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <input
                type="text"
                value={group.label}
                onChange={(e) => {
                  const v = e.target.value;
                  const ps = [...playerStats];
                  ps[groupIndex] = {
                    ...group,
                    label: v,
                  };
                  handleUpdateStats(ps);
                }}
              />

              <GroupWrapper>
                {group.stats.map((stat, statIndex) => (
                  <div key={statIndex}>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        const ps = [...playerStats];
                        const stats = [...group.stats];
                        stats[statIndex] = {
                          ...(stats[statIndex] as PlayerStatConfig),
                          label,
                        };
                        ps[groupIndex] = {
                          ...group,
                          stats,
                        };
                        handleUpdateStats(ps);
                      }}
                    />
                    <br />

                    {stat.type === 'input' && (
                      <div>
                        <select
                          value={stat.format}
                          onChange={(e) => {
                            const format = e.target.value;
                            const ps = [...playerStats];
                            const stats = [...group.stats];
                            stats[statIndex] = {
                              ...(stats[statIndex] as PlayerInputConfig),
                              format: format as
                                | 'string'
                                | 'number'
                                | 'currency',
                            };
                            ps[groupIndex] = {
                              ...group,
                              stats,
                            };
                            handleUpdateStats(ps);
                          }}
                        >
                          <option value={undefined}>-</option>
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="currency">Currency</option>
                        </select>
                      </div>
                    )}

                    {stat.type === 'attr' && (
                      <div>
                        <textarea
                          value={stat.values
                            .map((value) => {
                              const out: (string | number)[] = [value.label];
                              if (value.value != null) {
                                out.push(value.value);
                              }
                              return out.join(':');
                            })
                            .join(',\n')}
                          onChange={(e) => {
                            const text = e.target.value;
                            const ps = [...playerStats];
                            const stats = [...group.stats];
                            stats[statIndex] = {
                              ...(stats[statIndex] as PlayerSelectConfig),
                              values: text
                                .replace(/\n/g, '')
                                .split(',')
                                .map((v) => {
                                  const [label, value = null] = v.split(':');
                                  return {
                                    id: slug.nice(),
                                    label,
                                    value,
                                  };
                                }),
                            };
                            ps[groupIndex] = {
                              ...group,
                              stats,
                            };
                            handleUpdateStats(ps);
                          }}
                        />
                        <textarea
                          value={
                            !stat.modifiers
                              ? undefined
                              : stat.modifiers
                                  .map((modifier) => {
                                    const out: (string | number)[] = [
                                      modifier.label,
                                    ];
                                    if (modifier.value != null) {
                                      out.push(modifier.value);
                                    }
                                    return out.join(':');
                                  })
                                  .join(',\n')
                          }
                          onChange={(e) => {
                            const text = e.target.value;
                            const ps = [...playerStats];
                            const stats = [...group.stats];
                            stats[statIndex] = {
                              ...(stats[statIndex] as PlayerAttrConfig),
                              modifiers: text
                                .replace(/\n/g, '')
                                .split(',')
                                .map((v) => {
                                  const [label, value = null] = v.split(':');
                                  return {
                                    id: slug.nice(),
                                    label,
                                    value,
                                  };
                                }),
                            };
                            ps[groupIndex] = {
                              ...group,
                              stats,
                            };
                            handleUpdateStats(ps);
                          }}
                        />
                      </div>
                    )}
                    {stat.type === 'select' && (
                      <div>
                        <label>
                          Select One?
                          <input
                            type="checkbox"
                            checked={stat.exclusive}
                            onChange={(e) => {
                              const exclusive = e.target.checked;
                              const ps = [...playerStats];
                              const stats = [...group.stats];
                              stats[statIndex] = {
                                ...(stats[statIndex] as PlayerSelectConfig),
                                exclusive,
                              };
                              ps[groupIndex] = {
                                ...group,
                                stats,
                              };
                              handleUpdateStats(ps);
                            }}
                          />
                        </label>
                        <textarea
                          value={stat.values
                            .map((value) => {
                              const out: (string | number)[] = [value.label];
                              if (value.description != null) {
                                out.push(value.description);
                              }
                              if (value.value != null) {
                                out.push(value.value);
                              }
                              return out.join(':');
                            })
                            .join(',\n')}
                          onChange={(e) => {
                            const text = e.target.value;
                            const ps = [...playerStats];
                            const stats = [...group.stats];
                            stats[statIndex] = {
                              ...(stats[statIndex] as PlayerSelectConfig),
                              values: text
                                .replace(/\n/g, '')
                                .split(',')
                                .map((v) => {
                                  const [
                                    label,
                                    description = null,
                                    value = null,
                                    modifiers,
                                  ] = v.split(':');
                                  return {
                                    id: slug.nice(),
                                    label,
                                    description,
                                    value,
                                  };
                                }),
                            };
                            ps[groupIndex] = {
                              ...group,
                              stats,
                            };
                            handleUpdateStats(ps);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div>
                  <Button
                    design="primary"
                    onClick={() => {
                      const stats = [...playerStats];
                      stats[groupIndex] = {
                        ...group,
                        stats: [
                          ...group.stats,
                          {
                            id: slug.nice(),
                            label: 'Attr',
                            type: 'attr',
                            checkable: true,
                            values: [],
                          },
                        ],
                      };
                      handleUpdateStats(stats);
                    }}
                  >
                    Add Attribute
                  </Button>
                  <Button
                    design="primary"
                    onClick={() => {
                      const stats = [...playerStats];
                      stats[groupIndex] = {
                        ...group,
                        stats: [
                          ...group.stats,
                          {
                            id: slug.nice(),
                            label: 'Number',
                            type: 'input',
                            format: 'number',
                          },
                        ],
                      };
                      handleUpdateStats(stats);
                    }}
                  >
                    Add Input
                  </Button>
                  <Button
                    design="primary"
                    onClick={() => {
                      const stats = [...playerStats];
                      stats[groupIndex] = {
                        ...group,
                        stats: [
                          ...group.stats,
                          {
                            id: slug.nice(),
                            label: 'Select',
                            type: 'select',
                            exclusive: false,
                            values: [],
                          },
                        ],
                      };
                      handleUpdateStats(stats);
                    }}
                  >
                    Add Select
                  </Button>
                </div>
              </GroupWrapper>
            </div>
          ))}
          <div>
            <Button design="primary" onClick={handleAddGroup}>
              Add Group
            </Button>
          </div>
        </StatsWrapper>
      </Modal.Content>
    </Modal>
  );
}
