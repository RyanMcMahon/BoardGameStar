import React from 'react';
import styled from 'styled-components';
import slug from 'slugid';
import { Layer, Image } from 'react-konva';

import { Button } from '../../utils/style';
import { Table } from '../Table';
import { loadAsset, getFilename, getAssetDimensions } from '../../utils/assets';
import {
  RenderPiece,
  EditorAction,
  EditorState,
  PlayerOption,
  AnyPiece,
  RectPieceOption,
  CircleTokenOption,
} from '../../types';
import { ImagePiece, Deck, CirclePiece, RectPiece } from '../Piece';
import useImage from 'use-image';
import { DeckEditorModal } from '../DeckEditorModal/DeckEditorModal';
import { ScenarioModal } from '../ScenarioModal';
import { PlayArea } from '../Piece/PlayArea';

const fs = window.require('fs');

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
  top: 0,
  right: 0,
  bottom: 0,
  width: '300px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fafafa',
  padding: '1rem',
  button: {
    marginTop: '.5rem',
  },
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
  position: 'absolute',
  bottom: '1rem',
  left: '1rem',
});

const ExitButton = styled(Button)({
  position: 'absolute',
  bottom: '1rem',
  right: '1rem',
});

export function Editor(props: Props) {
  const { state, dispatch } = props;
  const [assets, setAssets] = React.useState<{ [key: string]: string }>({});
  const [files, setFiles] = React.useState<{ [key: string]: string }>({});
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>();
  const [deckModalId, setDeckModalId] = React.useState<string>();
  const [scenarioModalIsShowing, setScenarioModalIsShowing] = React.useState(
    false
  );
  // const [
  //   editorHelpModalIsShowing,
  //   setEditorHelpModalIsShowing,
  // ] = React.useState(false);
  const selectedPiece = selectedPieceId ? state.pieces[selectedPieceId] : null;
  const curScenario = state.scenarios[state.curScenario];
  const [axisImage] = useImage(`/axis.png`);

  const handleSave = () => {
    const configFile = `module.exports = ${JSON.stringify(state, null, '\t')};`;
    const outPath = `./games/${state.gameName}`;

    try {
      fs.mkdirSync(outPath, { recursive: true });
      fs.mkdirSync(`${outPath}/images`, { recursive: true });
      fs.writeFileSync(`${outPath}/config.js`, configFile, 'utf8');
      for (let i in files) {
        fs.copyFileSync(files[i], `${outPath}/images/${i}`);
      }
    } catch (err) {
      console.log('Save Error');
      console.log(err);
    }

    // Exit (HACK)
    dispatch({
      type: 'set_cur_scenario',
      scenarioId: '',
    });
  };

  const handleSelectPiece = (id: string) => () => {
    if (id === selectedPieceId) {
      setSelectedPieceId(null);
    } else {
      setSelectedPieceId(id);
    }
  };

  const handleUpdateGameName = (e: React.FormEvent<HTMLInputElement>) => {
    dispatch({
      type: 'update_game_name',
      gameName: e.currentTarget.value || state.gameName,
    });
  };

  const handleAddPlayer = () => {
    const id = slug.nice();
    const piece = {
      id,
      type: 'player',
      width: 0,
      height: 0,
      color: playerColors[curScenario.players.length] || '#333',
      x: 50,
      y: 50,
      rotation: 0,
      layer: 9,
    } as AnyPiece;
    dispatch({
      piece,
      type: 'add_piece',
    });
    setSelectedPieceId(id);
  };

  const createNewImagePiece = (options: any) => async () => {
    try {
      const [file] = (window as any).electron.dialog.showOpenDialogSync({
        properties: ['openFile'],
      });
      const filename = getFilename(file);
      const asset = loadAsset(file);
      const { width, height } = await getAssetDimensions(asset);
      const id = slug.nice();
      const piece = {
        id,
        width,
        height,
        ...options,
        image: filename,
        x: 50,
        y: 50,
        rotation: 0,
      };
      dispatch({
        piece,
        type: 'add_piece',
      });
      setAssets(a => ({ ...a, [filename]: asset }));
      setFiles(a => ({ ...a, [filename]: file }));
      setSelectedPieceId(id);
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
    setSelectedPieceId(id);
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
    setSelectedPieceId(piece.id);
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
    setSelectedPieceId(piece.id);
  };

  const handleDeletePiece = () => {
    if (!selectedPiece) {
      return;
    }
    dispatch({
      id: selectedPiece.id,
      type: 'remove_piece',
    });
    setSelectedPieceId(null);
  };

  console.log(state);
  // console.log(decks);

  const layers = curScenario.pieces.reduce(
    (agg: RenderPiece[][], id: string) => {
      const piece = state.pieces[id];
      agg[piece.layer] = agg[piece.layer] || [];
      agg[piece.layer].push((piece as unknown) as RenderPiece);
      return agg;
    },
    []
  );

  return (
    <MainContainer>
      <AppContainer>
        <Table>
          <Layer>
            <Image image={axisImage} x={0} y={0} />
          </Layer>
          {layers.map(
            (layer, layerDepth) =>
              layer &&
              layer.length && (
                <Layer key={layerDepth}>
                  {layer.map(piece => {
                    switch (piece.type) {
                      // Board
                      case 'board':
                        return (
                          <ImagePiece
                            key={piece.id}
                            assets={assets}
                            piece={piece}
                            draggable={true}
                            isSelected={piece.id === selectedPieceId}
                            onChange={b => {
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  ...piece,
                                  ...b,
                                },
                              });
                            }}
                            onSelect={handleSelectPiece(piece.id)}
                          />
                        );

                      // Deck
                      case 'deck':
                        return (
                          <Deck
                            key={piece.id}
                            assets={assets}
                            piece={piece}
                            isSelected={piece.id === selectedPieceId}
                            onSelect={handleSelectPiece(piece.id)}
                            onChange={b => {
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  ...piece,
                                  ...b,
                                },
                              });
                            }}
                            onDblClick={() => setDeckModalId(piece.id)}
                          />
                        );

                      // Image Token
                      case 'image':
                        return (
                          <ImagePiece
                            key={piece.id}
                            assets={assets}
                            piece={piece}
                            draggable={true}
                            isSelected={piece.id === selectedPieceId}
                            onChange={b => {
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  ...piece,
                                  ...b,
                                },
                              });
                            }}
                            onSelect={handleSelectPiece(piece.id)}
                          />
                        );

                      // Rectangle
                      case 'rect':
                        return (
                          <RectPiece
                            key={piece.id}
                            piece={piece}
                            isSelected={piece.id === selectedPieceId}
                            onChange={b => {
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  ...piece,
                                  ...b,
                                },
                              });
                            }}
                            onSelect={handleSelectPiece(piece.id)}
                          />
                        );

                      // Circle
                      case 'circle':
                        return (
                          <CirclePiece
                            key={piece.id}
                            piece={piece}
                            isSelected={piece.id === selectedPieceId}
                            onChange={b => {
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  ...piece,
                                  ...b,
                                },
                              });
                            }}
                            onSelect={handleSelectPiece(piece.id)}
                          />
                        );

                      // Player
                      case 'player':
                        return (
                          <PlayArea
                            key={piece.id}
                            piece={{
                              ...piece,
                              name: `Player ${curScenario.players.findIndex(
                                id => id === piece.id
                              ) + 1}`,
                            }}
                            handCount={0}
                            isSelected={piece.id === selectedPieceId}
                            onChange={b => {
                              dispatch({
                                type: 'update_piece',
                                piece: {
                                  ...piece,
                                  ...b,
                                },
                              });
                            }}
                            onSelect={handleSelectPiece(piece.id)}
                          />
                        );

                      default:
                        return null;
                    }
                  })}
                </Layer>
              )
          )}
        </Table>
      </AppContainer>

      <ControlsContainer>
        <label>New Game</label>
        <input
          type="text"
          value={state.gameName}
          onChange={handleUpdateGameName}
        />

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

        {/* <input
          type="number"
          min={2}
          value={state.gameName}
          onChange={handleUpdatePlayerCount}
        /> */}

        <label>Pieces</label>
        <Button design="primary" onClick={handleAddPlayer}>
          Add Player
        </Button>
        <Button design="primary" onClick={handleAddBoard}>
          Add Board
        </Button>
        <Button design="primary" onClick={handleAddCircle}>
          Add Circle Token
        </Button>
        <Button design="primary" onClick={handleAddImageToken}>
          Add Image Token
        </Button>
        <Button design="primary" onClick={handleAddRect}>
          Add Rect Token
        </Button>
        <Button design="primary" onClick={handleAddDeck}>
          Add Deck
        </Button>
        {/* <Button design="primary" onClick={handleAddCard}>
          Add Card
        </Button> */}

        {selectedPieceId && (
          <>
            <label>Selected Piece</label>
            {selectedPiece && selectedPiece.hasOwnProperty('color') && (
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
                      } as AnyPiece,
                    });
                  }}
                />
                {selectedPiece.type !== 'player' && (
                  <div>
                    {curScenario.players.map((playerId, index) => (
                      <ColorSwatch
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
                              color: (state.pieces[playerId] as PlayerOption)
                                .color,
                            } as AnyPiece,
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
      </ControlsContainer>
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
      {deckModalId && (
        <DeckEditorModal
          deckId={deckModalId}
          dispatch={dispatch}
          assets={assets}
          setAssets={setAssets}
          setFiles={setFiles}
          state={state}
          onClose={() => setDeckModalId('')}
        />
      )}
    </MainContainer>
  );
}
