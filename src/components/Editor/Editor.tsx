import React from 'react';
import styled from 'styled-components';
import slug from 'slugid';
// import FPSStats from 'react-fps-stats';

import { Button } from '../../utils/style';
import { Table, useTable } from '../../utils/useTable';
import { getAssetDimensions, filePrompt } from '../../utils/assets';
import {
  EditorAction,
  EditorState,
  PlayerOption,
  AnyPieceOption,
  RectPieceOption,
  CircleTokenOption,
  RenderPiece,
  Game,
  PublicGame,
  StackablePieceOption,
  GamePrompt,
} from '../../types';
import { DeckEditorModal } from '../DeckEditorModal/DeckEditorModal';
import { ScenarioModal } from '../ScenarioModal';
import { addGame } from '../../utils/store';
import { FaExpand } from 'react-icons/fa';
import { EditGameModal } from '../EditGameModal';
import { EditPromptModal } from '../EditPromptModal';
import { Prompt } from 'react-router-dom';

interface Props {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
}

const playerColors = [
  '#e74c3c',
  '#f1c40f',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#34495e',
];

const MainContainer = styled.div({
  height: '100%',
});

const AppContainer = styled.div({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  height: '100%',

  // Light Gray
  backgroundColor: '#dbdfe5',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%23bdc5ca' fill-opacity='0.50' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
});

const ControlsContainer = styled.div({
  position: 'fixed',
  overflowY: 'auto',
  top: 0,
  right: 0,
  bottom: 0,
  width: '300px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fafafa',
  padding: '1rem',
  // button: {
  //   marginTop: '.5rem',
  // },
  'label:nth-child(n+2)': {
    marginTop: '2rem',
  },
  select: {
    marginBottom: 0,
  },
  input: {
    marginBottom: 0,
  },
});

const Controls = styled.div({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

const EditorNav = styled.div({
  display: 'flex',
  flexDirection: 'row',
});

const InlineInputContainer = styled.div({
  input: {
    marginLeft: '1rem',
    width: '75px',
  },
});

const PromptsWrapper = styled.div({
  marginBottom: '.5rem',
  [Button]: {
    marginLeft: '.5rem',
  },
});

const ColorSwatch = styled.div({
  color: '#fff',
  cursor: 'pointer',
  display: 'inline-block',
  padding: '.5rem 1rem',
  borderRadius: '4px',
  marginRight: '.5rem',
  marginTop: '.5rem',
});

const SaveButton = styled(Button)({
  flex: 1,
  marginRight: '.5rem',
});

const ExitButton = styled(Button)({
  flex: 1,
  marginLeft: '.5rem',
});

const FullScreenButton = styled(Button)({
  margin: '0 !important',
  fontSize: '24px',
  lineHeight: '20px',
  paddingLeft: '.5rem',
  paddingRight: '.5rem',
});

const ToggleControlsButton = styled.div({
  position: 'absolute',
  top: '1rem',
  right: 0,
  padding: '.25rem 1rem .5rem 1.5rem',
  borderRadius: '8px 0 0 8px',
  fontSize: '50px',
  lineHeight: '24px',
  height: '34px',
  backgroundColor: 'rgba(0, 0, 0, .2)',
  color: '#fff',
  zIndex: 2000,
  cursor: 'pointer',
});

const ButtonGrid = styled.div({
  display: 'grid',
  gridGap: '.5rem',
  gridTemplateColumns: `repeat(2, 1fr)`,
});

const tableConfig = {
  board: {
    selectable: true,
    draggable: true,
    rotatable: true,
    resizable: true,
  },
  deck: {
    selectable: true,
    draggable: true,
    rotatable: true,
    resizable: true,
  },
  card: {
    selectable: true,
    draggable: true,
    rotatable: true,
    resizable: true,
  },
  money: {
    selectable: true,
    draggable: true,
    rotatable: true,
    resizable: true,
  },
  image: {
    selectable: true,
    draggable: true,
    rotatable: true,
    resizable: true,
  },
  rect: {
    selectable: true,
    draggable: true,
    rotatable: true,
    resizable: true,
  },
  circle: {
    selectable: true,
    draggable: true,
    resizable: true,
  },
  die: {
    selectable: true,
    draggable: true,
  },
  player: {
    selectable: true,
    draggable: true,
  },
};

export function Editor(props: Props) {
  const { state, dispatch } = props;
  const [assets, setAssets] = React.useState<{ [key: string]: string }>(
    state.assets || {}
  );
  const [selectedPrompt, setSelectedPrompt] = React.useState<number | null>(0);
  const [promptModalIndex, setPromptModalIndex] = React.useState<number | null>(
    null
  );
  const [deckModalId, setDeckModalId] = React.useState<string>();
  const [showControls, setShowControls] = React.useState(true);
  const [showEditGameModal, setShowEditGameModal] = React.useState(false);
  const [scenarioModalIsShowing, setScenarioModalIsShowing] = React.useState(
    false
  );

  const table = useTable({
    assets,
    singleSelection: true,
    config: tableConfig,
    onDblClickDeck: (id: string) => setDeckModalId(id),
    handleCreateStack: () => {},
    handleSplitStack: () => {},
    handleSubmitTransaction: () => {},
    handleUpdatePiece: p =>
      dispatch({
        type: 'update_piece',
        piece: {
          ...state.pieces[p.id],
          ...p,
        } as AnyPieceOption,
      }),
  });
  const { setPieces, selectedPieceIds, setSelectedPieceIds } = table;

  const [selectedPieceId] = Array.from(selectedPieceIds);
  const selectedPiece = selectedPieceId ? state.pieces[selectedPieceId] : null;
  const curScenario = state.scenarios[state.curScenario];

  const handleSave = async () => {
    const game: Game | PublicGame = {
      id: state.id,
      tags: state.tags,
      store: state.store,
      version: state.version,
      name: state.name,
      thumbnail: state.thumbnail,
      summary: state.summary,
      description: state.description,
      config: {
        prompts: state.prompts,
        currency: state.currency,
        curScenario: state.curScenario,
        scenarios: state.scenarios,
        pieces: state.pieces,
      },
    };

    if (game.store === 'browser') {
      await addGame(game, assets);
    } else {
      const fs = window.require('fs');
      const configFile = `module.exports = ${JSON.stringify(
        game,
        null,
        '\t'
      )};`;
      const outPath = `./games/${game.name}`;

      try {
        fs.mkdirSync(outPath, { recursive: true });
        fs.mkdirSync(`${outPath}/images`, { recursive: true });
        fs.writeFileSync(`${outPath}/config.js`, configFile, 'utf8');
        for (let i in assets) {
          fs.writeFileSync(
            `${outPath}/images/${i}`,
            assets[i].replace(/^data:image\/\w+;base64,/, ''),
            'base64'
          );
        }
      } catch (err) {
        console.log('Save Error');
        console.log(err);
      }
    }

    // Exit (HACK)
    dispatch({
      type: 'set_cur_scenario',
      scenarioId: '',
    });
  };

  // const handleUpdateGameName = (e: React.FormEvent<HTMLInputElement>) => {
  //   dispatch({
  //     type: 'update_game_name',
  //     name: e.currentTarget.value || state.name,
  //   });
  // };

  const handleAddPlayer = () => {
    const id = slug.nice();
    const piece = {
      id,
      type: 'player',
      name: '',
      width: 0,
      height: 0,
      color: playerColors[curScenario.players.length] || '#333',
      x: 50,
      y: 50,
      rotation: 0,
      layer: 9,
    } as AnyPieceOption;
    dispatch({
      piece,
      type: 'add_piece',
    });
    setSelectedPieceIds(new Set([id]));
  };

  const createNewImagePiece = (options: any) => async () => {
    try {
      const files = await filePrompt();

      files.forEach(async (file, index: number) => {
        const filename = file.name;
        const asset = file.content;
        const { width, height } = await getAssetDimensions(asset);
        const id = slug.nice();
        const piece = {
          id,
          width,
          height,
          ...options,
          image: filename,
          x: 50 + index * 20,
          y: 50 + index * 20,
          rotation: 0,
        };
        dispatch({
          piece,
          type: 'add_piece',
        });
        setAssets(a => ({ ...a, [filename]: asset }));
        setSelectedPieceIds(new Set([id]));
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddBoard = createNewImagePiece({ type: 'board', layer: 1 });
  const handleAddDeck = createNewImagePiece({
    type: 'deck',
    layer: 3,
    cards: [],
    name: 'Deck',
  });
  const handleAddMoney = createNewImagePiece({
    type: 'money',
    layer: 9,
    balance: Infinity,
  });
  const handleAddImageToken = createNewImagePiece({ type: 'image', layer: 5 });

  const handleAddCircle = () => {
    const id = slug.nice();
    const piece = {
      type: 'circle' as const,
      id,
      x: 100,
      y: 100,
      rotation: 0,
      radius: 20,
      layer: 5,
      color: '#0088cc',
    };
    dispatch({
      piece,
      type: 'add_piece',
    });
    setSelectedPieceIds(new Set([id]));
  };

  const handleAddRect = () => {
    const id = slug.nice();
    const piece = {
      id,
      type: 'rect' as const,
      x: 100,
      y: 100,
      rotation: 0,
      width: 50,
      height: 50,
      layer: 5,
      color: '#0088cc',
    };
    dispatch({
      piece,
      type: 'add_piece',
    });
    setSelectedPieceIds(new Set([id]));
  };

  const handleDuplicatePiece = () => {
    if (!selectedPiece) {
      return;
    }
    const piece = {
      ...selectedPiece,
      id: slug.nice(),
      x:
        selectedPiece.x +
        (selectedPiece.hasOwnProperty('width')
          ? (selectedPiece as RectPieceOption).width
          : (selectedPiece as CircleTokenOption).radius * 2) +
        20,
    };
    dispatch({
      piece,
      type: 'add_piece',
    });
    setSelectedPieceIds(new Set([piece.id]));
  };

  const handleDeletePiece = () => {
    if (!selectedPiece) {
      return;
    }
    dispatch({
      id: selectedPiece.id,
      type: 'remove_piece',
    });
    setSelectedPieceIds(new Set());
  };

  React.useEffect(() => {
    setPieces([
      ...(curScenario.pieces.map(
        id => state.pieces[id]
      ) as RenderPiece[]).filter(piece => piece.type !== 'card'),
      {
        id: 'axis',
        type: 'image',
        x: 0,
        y: 0,
        image: 'axis.png',
        width: 200,
        height: 200,
        layer: 0,
        rotation: 0,
        delta: 0,
      },
    ]);
  }, [curScenario.pieces, state.pieces, setPieces]);

  return (
    <MainContainer>
      <AppContainer>
        <Table ref={table.stageRef} />
      </AppContainer>

      <ToggleControlsButton onClick={() => setShowControls(!showControls)}>
        {showControls ? <>&rsaquo;</> : <>&lsaquo;</>}
      </ToggleControlsButton>

      {showControls && (
        <ControlsContainer>
          <Controls>
            <div>
              <FullScreenButton
                design="primary"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                  } else {
                    if (document.exitFullscreen) {
                      document.exitFullscreen();
                    }
                  }
                }}
              >
                <FaExpand />
              </FullScreenButton>
            </div>
            <label>Edit {state.name}</label>
            <Button design="primary" onClick={() => setShowEditGameModal(true)}>
              Properties
            </Button>
            {/* <label>Edit Game</label>
            <input
              type="text"
              value={state.name}
              onChange={handleUpdateGameName}
            /> */}

            <label>Scenarios</label>
            {Object.values(state.scenarios).length > 1 && (
              <>
                <select
                  defaultValue={curScenario.id}
                  onChange={(e: React.FormEvent<HTMLSelectElement>) =>
                    dispatch({
                      type: 'set_cur_scenario',
                      scenarioId: e.currentTarget.value,
                    })
                  }
                >
                  {Object.values(state.scenarios).map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
                <Button
                  design="primary"
                  onClick={() => setScenarioModalIsShowing(true)}
                >
                  Rename Scenario
                </Button>
              </>
            )}
            <Button
              design="primary"
              onClick={() => {
                dispatch({
                  type: 'duplicate_scenario',
                  scenarioId: curScenario.id,
                });
                setScenarioModalIsShowing(true);
              }}
            >
              Duplicate Scenario
            </Button>

            <label>Prompts</label>
            {state.prompts && (
              <PromptsWrapper>
                <select
                  onChange={e => {
                    const index = parseInt(e.currentTarget.value, 10);
                    setSelectedPrompt(index);
                  }}
                >
                  {(state.prompts || []).map((prompt: GamePrompt, index) => (
                    <option key={index} value={index}>
                      {prompt.title}
                    </option>
                  ))}
                </select>
                <Button
                  design="primary"
                  onClick={() => setPromptModalIndex(selectedPrompt)}
                >
                  Edit Prompt
                </Button>
              </PromptsWrapper>
            )}
            <Button
              className="u-full-width"
              design="primary"
              onClick={() => {
                const prompts = [
                  ...(state.prompts || []),
                  {
                    title: '',
                    inputs: [],
                  },
                ];
                dispatch({
                  game: {
                    prompts,
                  },
                  type: 'update_game',
                });
                setPromptModalIndex(prompts.length - 1);
              }}
            >
              Add Prompt
            </Button>

            <label>Pieces</label>
            <ButtonGrid>
              <Button
                className="u-full-width"
                design="primary"
                onClick={handleAddPlayer}
              >
                Add Player
              </Button>
              <Button
                className="u-full-width"
                design="primary"
                onClick={handleAddBoard}
              >
                Add Board
              </Button>
              <Button design="primary" onClick={handleAddCircle}>
                Add Circle
              </Button>
              <Button design="primary" onClick={handleAddImageToken}>
                Add Image
              </Button>
              <Button design="primary" onClick={handleAddRect}>
                Add Rect
              </Button>
              <Button design="primary" onClick={handleAddDeck}>
                Add Deck
              </Button>
              <Button
                className="u-full-width"
                design="primary"
                onClick={handleAddMoney}
              >
                Add Money
              </Button>
            </ButtonGrid>

            {!!selectedPiece && (
              <>
                <label>Selected Piece</label>
                {selectedPiece.type === 'image' && (
                  <>
                    {selectedPiece.back && (
                      <img
                        alt="selected piece"
                        src={assets[selectedPiece.back]}
                      />
                    )}
                    <Button
                      design="primary"
                      onClick={async () => {
                        const [file] = await filePrompt({ multiple: false });
                        const filename = file.name;
                        const asset = file.content;
                        setAssets(a => ({ ...a, [filename]: asset }));
                        dispatch({
                          type: 'update_piece',
                          piece: {
                            ...selectedPiece,
                            back: filename,
                          },
                        });
                      }}
                    >
                      Add Back
                    </Button>
                  </>
                )}
                {selectedPiece.type === 'money' && (
                  <>
                    <InlineInputContainer>
                      Balance
                      <input
                        type="text"
                        value={selectedPiece.balance}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => {
                          const value = e.currentTarget.value;
                          const balance =
                            value.toLowerCase() === 'Infinity'
                              ? Infinity
                              : parseInt(value, 10);

                          dispatch({
                            type: 'update_piece',
                            piece: {
                              id: selectedPieceId,
                              balance: balance,
                            } as AnyPieceOption,
                          });
                        }}
                      />
                    </InlineInputContainer>
                    <InlineInputContainer>
                      Currency
                      <input
                        type="text"
                        value={state.currency}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => {
                          const currency = e.currentTarget.value;

                          dispatch({
                            game: {
                              currency,
                            },
                            type: 'update_game',
                          });
                          // dispatch({
                          //   type: 'update_piece',
                          //   piece: {
                          //     id: selectedPieceId,
                          //     balance: balance,
                          //   } as AnyPieceOption,
                          // });
                        }}
                      />
                    </InlineInputContainer>
                  </>
                )}
                {!['player', 'money'].includes(selectedPiece.type) && (
                  <>
                    <InlineInputContainer>
                      Min Players For Piece
                      <input
                        type="number"
                        value={(selectedPiece.counts || '1:1').split(':')[0]}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => {
                          const playerCount = e.currentTarget.value;
                          const [, c] = (selectedPiece.counts || '1:1').split(
                            ':'
                          );

                          dispatch({
                            type: 'update_piece',
                            piece: {
                              id: selectedPieceId,
                              counts: `${playerCount}:${c}`,
                            } as AnyPieceOption,
                          });
                        }}
                      />
                    </InlineInputContainer>
                    <InlineInputContainer>
                      Piece Count
                      <input
                        type="number"
                        value={(selectedPiece.counts || '1:1').split(':')[1]}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => {
                          const count = e.currentTarget.value;
                          const [p] = (selectedPiece.counts || '1:1').split(
                            ':'
                          );

                          dispatch({
                            type: 'update_piece',
                            piece: {
                              id: selectedPieceId,
                              counts: `${p}:${count}`,
                            } as AnyPieceOption,
                          });
                        }}
                      />
                    </InlineInputContainer>
                    {/* Counts: {selectedPiece.counts || '1:1'} */}
                  </>
                )}
                {['rect', 'circle', 'image'].includes(selectedPiece.type) && (
                  <InlineInputContainer>
                    Stacking Class
                    <input
                      type="text"
                      value={(selectedPiece as StackablePieceOption).stack}
                      onChange={(e: React.FormEvent<HTMLInputElement>) => {
                        const stack = e.currentTarget.value;
                        dispatch({
                          type: 'update_piece',
                          piece: {
                            stack,
                            id: selectedPieceId,
                          } as AnyPieceOption,
                        });
                      }}
                    />
                  </InlineInputContainer>
                )}

                {selectedPiece.hasOwnProperty('color') && (
                  <>
                    <input
                      type="color"
                      value={(selectedPiece as any).color}
                      onChange={(e: React.FormEvent<HTMLInputElement>) => {
                        const color = e.currentTarget.value;
                        dispatch({
                          type: 'update_piece',
                          piece: {
                            id: selectedPieceId,
                            color,
                          } as AnyPieceOption,
                        });
                      }}
                    />
                    {selectedPiece.type !== 'player' && (
                      <div>
                        {curScenario.players.map((playerId, index) => (
                          <ColorSwatch
                            key={playerId}
                            style={{
                              backgroundColor: (state.pieces[
                                playerId
                              ] as PlayerOption).color,
                            }}
                            onClick={() =>
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  id: selectedPieceId,
                                  color: (state.pieces[
                                    playerId
                                  ] as PlayerOption).color,
                                } as AnyPieceOption,
                              })
                            }
                          >
                            Player {index + 1}
                          </ColorSwatch>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <Button design="primary" onClick={handleDuplicatePiece}>
                  Duplicate
                </Button>
                <Button design="danger" onClick={handleDeletePiece}>
                  Delete
                </Button>
              </>
            )}
          </Controls>

          <div>
            {state.store === 'browser'
              ? `Game Will Be Saved To Browser`
              : `Game Will Be Saved To Disk`}
          </div>
          <EditorNav>
            <SaveButton design="success" onClick={handleSave}>
              Save & Exit
            </SaveButton>
            <ExitButton
              design="danger"
              onClick={() =>
                // Hack
                dispatch({
                  type: 'set_cur_scenario',
                  scenarioId: '',
                })
              }
            >
              Exit Editor
            </ExitButton>
          </EditorNav>
        </ControlsContainer>
      )}
      {scenarioModalIsShowing && (
        <ScenarioModal
          onClose={() => setScenarioModalIsShowing(false)}
          scenario={curScenario}
          onSave={name => {
            dispatch({
              type: 'update_scenario',
              scenario: {
                ...curScenario,
                name,
              },
            });
            setScenarioModalIsShowing(false);
          }}
        />
      )}

      {promptModalIndex !== null &&
        state.prompts &&
        state.prompts[promptModalIndex] && (
          <EditPromptModal
            prompt={state.prompts[promptModalIndex]}
            onClose={() => setPromptModalIndex(null)}
            onUpdate={prompt => {
              dispatch({
                game: {
                  prompts: [
                    ...(state.prompts || []).slice(0, promptModalIndex),
                    prompt,
                    ...(state.prompts || []).slice(promptModalIndex + 1),
                  ],
                },
                type: 'update_game',
              });
            }}
          />
        )}

      {deckModalId && (
        <DeckEditorModal
          deckId={deckModalId}
          dispatch={dispatch}
          assets={assets}
          setAssets={setAssets}
          state={state}
          onClose={() => setDeckModalId('')}
        />
      )}

      {showEditGameModal && (
        <EditGameModal
          game={state}
          onUpdate={(game: Partial<Game>) =>
            dispatch({
              game,
              type: 'update_game',
            })
          }
          onClose={() => setShowEditGameModal(false)}
        />
      )}
      {/* <FPSStats /> */}
    </MainContainer>
  );
}
