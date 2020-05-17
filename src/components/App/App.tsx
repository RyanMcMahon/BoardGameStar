import React from 'react';
import styled from 'styled-components';
import * as _ from 'lodash';
import { useParams, Link, Redirect } from 'react-router-dom';

import { useGameClient } from '../../utils/client';
import { Button } from '../../utils/style';
import { Table } from '../Table';
import { ControlsModal } from '../ControlsModal';
import { InviteModal } from '../InviteModal';

import { Hand } from '../Hand';
import { DeckModal } from '../DeckModal';
import { RenameModal } from '../RenameModal';
import { ProgressBar } from '../ProgressBar';
import { facts } from '../../utils/facts';
import { RenderPiece, AnyPiece, ContextMenuItem } from '../../types';
import { Layer } from 'react-konva';
import { ImagePiece, Deck, RectPiece, CirclePiece } from '../Piece';
import { PlayArea } from '../Piece/PlayArea';

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

const ContextMenu = styled.ul({
  padding: '1rem',
  listStyle: 'none',
  background: '#fff',
  position: 'absolute',
  zIndex: 1000,
  border: '1px solid #333',
  li: {
    padding: '.5rem',
    ':hover': {
      cursor: 'pointer',
      color: '#6E48AA',
    },
  },
});

const PlayerContainer = styled.div({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '505px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fafafa',
});

const PlayerLinksContainer = styled.div({
  padding: '1rem',
  '> button:nth-child(n+2)': {
    marginLeft: '1rem',
  },
});

const HandContainer = styled.div({
  flex: 1,
  display: 'flex',
  position: 'relative',
});

const LoadingPage = styled.div({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: '#fff',
  padding: '5rem',
});

const LoadingContainer = styled.div({
  margin: '0 auto',
  maxWidth: '600px',
});

const LoadingFact = styled.h3({
  margin: '1rem 0',
  fontSize: '2rem',
});

const LoadingFactSubheader = styled.h4({
  margin: '0 0 2rem',
  fontSize: '1.5rem',
});

const FailedConnection = styled.h4({
  fontSize: '3rem',
  color: '#e74c3c',
});

export const App: React.FC = () => {
  const { gameId = '' } = useParams();
  const {
    playerId,
    conn,
    board,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    setBoard,
    failedConnection,
  } = useGameClient(gameId);
  const fact = React.useMemo(() => _.sample(facts), []);
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>();
  const [drawModalId, setDrawModalId] = React.useState<string>('');
  const [showRenameModal, setShowRenameModal] = React.useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = React.useState<boolean>(false);
  const [showControlsModal, setShowControlsModal] = React.useState<boolean>(
    false
  );
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>({ x: 0, y: 0, items: [] });

  const handleUpdatePieceUnThrottled = (piece: AnyPiece) => {
    if (!conn) {
      return;
    }
    setBoard((b: RenderPiece[]) => {
      const index = b.findIndex(p => p.id === piece.id);
      const boardCopy = [...b];
      if (index > -1) {
        boardCopy.splice(index, 1, {
          ...boardCopy[index],
          ...piece,
          delta: boardCopy[index].delta + 1,
        } as RenderPiece);
      }
      return boardCopy;
    });
    conn.send({
      event: 'update_piece',
      piece: {
        ...piece,
        delta: (board.find(p => p.id === piece.id)?.delta || 0) + 1,
      } as any,
    });
  };

  const handleUpdatePiece = _.throttle(handleUpdatePieceUnThrottled, 50);

  const handlePickUpCard = (id: string) => () => {
    if (conn) {
      conn.send({
        event: 'pick_up_cards',
        cardIds: [id],
      });
    }
  };

  const handleRename = (name: string) => {
    if (conn) {
      conn.send({
        name,
        event: 'rename_player',
      });
      setShowRenameModal(false);
    }
  };

  const handlePlayCards = (cardIds: string[]) => {
    if (!conn) {
      return;
    }
    conn.send({
      cardIds,
      event: 'play_cards',
    });
  };

  const handleDrawCards = (count: number) => {
    if (!conn) {
      return;
    }
    conn.send({
      event: 'draw_cards',
      deckId: drawModalId,
      count,
    });
    setDrawModalId('');
  };

  const handleDiscard = (cardIds: string[]) => {
    if (conn) {
      conn.send({
        cardIds,
        event: 'discard',
      });
    }
  };

  const handleShuffleDiscarded = (deckId: string) => {
    if (conn) {
      conn.send({
        deckId,
        event: 'shuffle_discarded',
      });
    }
  };

  const handleDiscardPlayed = (id: string) => {
    if (conn) {
      conn.send({
        event: 'discard_played',
        deckId: id,
      });
    }
  };

  const handleSelectPiece = (id: string) => () => {
    if (id === selectedPieceId) {
      setSelectedPieceId(null);
    } else {
      setSelectedPieceId(id);
    }
  };

  const handlePromptRename = () => {
    setShowRenameModal(true);
  };

  const player = board.find(piece => piece.id === playerId);

  const layers = board.reduce((agg: RenderPiece[][], piece: RenderPiece) => {
    agg[piece.layer] = agg[piece.layer] || [];
    agg[piece.layer].push(piece);
    return agg;
  }, []);

  if (!gameId) {
    return <Redirect to="/" />;
  }

  return (
    <MainContainer>
      <AppContainer>
        {contextMenu && contextMenu.items.length > 0 && (
          <ContextMenu
            style={{
              left: contextMenu.x,
              top: contextMenu.y - 10, // TODO why is this off by 10?
            }}
          >
            {contextMenu.items.map(piece => (
              <li
                onClick={() => {
                  setContextMenu(null);
                  piece.fn();
                }}
              >
                {piece.label}
              </li>
            ))}
            <li onClick={() => setContextMenu(null)}>Cancel</li>
          </ContextMenu>
        )}
        <Table>
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
                          />
                        );

                      // Deck
                      case 'deck':
                        return (
                          <Deck
                            key={piece.id}
                            assets={assets}
                            piece={piece}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                            onDblClick={() => setDrawModalId(piece.id)}
                            onContextMenu={e =>
                              setContextMenu({
                                x: e.evt.clientX,
                                y: e.evt.clientY,
                                items: [
                                  {
                                    label: 'Draw Cards',
                                    fn: () => setDrawModalId(piece.id),
                                  },
                                  // {
                                  //   label: "Play Face Up",
                                  //   fn: () => {
                                  //     console.log("face down");
                                  //   }
                                  // },
                                  // {
                                  //   label: "Play Face Down",
                                  //   fn: () => {
                                  //     console.log("face up");
                                  //   }
                                  // },
                                  {
                                    label: 'Shuffle Discarded',
                                    fn: () => {
                                      console.log('context shuffle');
                                      handleShuffleDiscarded(piece.id);
                                    },
                                  },
                                  {
                                    label: 'Discard Played Cards',
                                    fn: () => {
                                      console.log('discard played');
                                      handleDiscardPlayed(piece.id);
                                    },
                                  },
                                ],
                              })
                            }
                          />
                        );

                      // Board
                      case 'card':
                        return (
                          <ImagePiece
                            key={piece.id}
                            assets={assets}
                            piece={piece}
                            draggable={true}
                            isSelected={piece.id === selectedPieceId}
                            onSelect={handleSelectPiece(piece.id)}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                            onDblClick={handlePickUpCard(piece.id)}
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
                            onSelect={handleSelectPiece(piece.id)}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                          />
                        );

                      // Rectangle
                      case 'rect':
                        return (
                          <RectPiece
                            key={piece.id}
                            piece={piece}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                          />
                        );

                      // Circle
                      case 'circle':
                        return (
                          <CirclePiece
                            key={piece.id}
                            piece={piece}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                          />
                        );

                      // Player
                      case 'player':
                        return (
                          <PlayArea
                            key={piece.id}
                            piece={piece}
                            handCount={handCounts[piece.id]}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
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

        <PlayerContainer>
          {player && (
            <h1
              style={{
                margin: 0,
                padding: 10,
                background: player.color,
                color: '#fff',
                cursor: 'pointer',
              }}
              onClick={handlePromptRename}
            >
              {player.name}
            </h1>
          )}
          <HandContainer>
            <Hand
              assets={assets}
              hand={myHand}
              playCards={handlePlayCards}
              discard={handleDiscard}
            />
          </HandContainer>
          <PlayerLinksContainer>
            <Button design="primary" onClick={() => setShowControlsModal(true)}>
              Controls
            </Button>
            <Button design="primary" onClick={() => setShowInviteModal(true)}>
              Invite
            </Button>

            <Link to="/" className="u-pull-right">
              <Button design="danger">Leave Game</Button>
            </Link>
          </PlayerLinksContainer>
        </PlayerContainer>
        {drawModalId && (
          <DeckModal
            onDrawCards={handleDrawCards}
            onClose={() => setDrawModalId('')}
          />
        )}
        {showRenameModal && (
          <RenameModal
            onSave={handleRename}
            onClose={() => setShowRenameModal(false)}
          />
        )}
        {showControlsModal && (
          <ControlsModal onClose={() => setShowControlsModal(false)} />
        )}
        {showInviteModal && (
          <InviteModal
            gameId={gameId}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AppContainer>
      {_.size(assets) === 0 && (
        <LoadingPage>
          <LoadingContainer>
            {failedConnection ? (
              <FailedConnection>Connection Failed</FailedConnection>
            ) : (
              <>
                <ProgressBar complete={percentLoaded} />
                <LoadingFact>{fact}</LoadingFact>
                <LoadingFactSubheader>
                  - Loading Screen Facts
                </LoadingFactSubheader>
              </>
            )}
            <Link to="/">Leave Game</Link>
          </LoadingContainer>
        </LoadingPage>
      )}
    </MainContainer>
  );
};
