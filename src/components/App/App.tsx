import React from 'react';
import styled from 'styled-components';
import * as _ from 'lodash';
import { useParams, Link, Redirect } from 'react-router-dom';

import { useGameClient } from '../../utils/client';
import { Button, breakPoints, maxMobileWidth } from '../../utils/style';
import { Table } from '../Table';
import { ControlsModal } from '../ControlsModal';
import { InviteModal } from '../InviteModal';

import { Hand } from '../Hand';
import { DeckModal } from '../DeckModal';
import { RenameModal } from '../RenameModal';
import { ProgressBar } from '../ProgressBar';
import { facts } from '../../utils/facts';
import { setName } from '../../utils/identity';
import { RenderPiece, PlayerPiece } from '../../types';
import { Layer } from 'react-konva';
import { ImagePiece, Deck, RectPiece, CirclePiece } from '../Piece';
import { PlayArea } from '../Piece/PlayArea';
import { ControlsMenu, ControlsMenuItem } from '../ControlsMenu';

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

const PlayerContainer = styled.div({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '505px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fafafa',
  zIndex: 1000,
  [breakPoints.mobile]: {
    width: '100%',
  },
});

const PlayerLinksContainer = styled.div({
  padding: '1rem',
  '> button:nth-child(n+2)': {
    marginLeft: '1rem',
  },
});

const TogglePlayerContainerButton = styled.div({
  position: 'absolute',
  top: '1rem',
  right: 0,
  padding: '.5rem 1rem .5rem 1.5rem',
  borderRadius: '8px 0 0 8px',
  fontSize: '100px',
  lineHeight: '24px',
  height: '50px',
  backgroundColor: 'rgba(0, 0, 0, .2)',
  color: '#fff',
  zIndex: 2000,
  cursor: 'pointer',
  [breakPoints.mobile]: {
    fontSize: '70px',
    lineHeight: '24px',
    height: '40px',
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
  zIndex: 3000,
});

const LoadingContainer = styled.div({
  margin: '0 auto',
  padding: '2rem',
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
  const { gameId = '', hostId = '' } = useParams();
  const {
    playerId,
    conn,
    pieces,
    board,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    setPieces,
    failedConnection,
  } = useGameClient(gameId, hostId);
  const fact = React.useMemo(() => _.sample(facts), []);
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>();
  const [showPlayerControls, setShowPlayerControls] = React.useState<boolean>(
    true
  );
  const [drawModalId, setDrawModalId] = React.useState<string>('');
  const [showRenameModal, setShowRenameModal] = React.useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = React.useState<boolean>(false);
  const [showControlsModal, setShowControlsModal] = React.useState<boolean>(
    false
  );
  const tableRef = React.createRef<{
    zoomIn: () => void;
    zoomOut: () => void;
  }>();

  React.useLayoutEffect(() => {
    if (window.innerWidth < maxMobileWidth) {
      setShowPlayerControls(false);
    }
  }, []);

  const pieceControls = (
    piece: RenderPiece | undefined
  ): ControlsMenuItem[] => {
    const items = [];

    if (piece) {
      switch (piece.type) {
        case 'card':
          items.push(
            ...[
              {
                icon: '⟳',
                label: 'Flip Card',
                fn: () =>
                  handleUpdatePiece({ ...piece, faceDown: !piece.faceDown }),
              },
            ]
          );
          break;

        case 'deck':
          items.push(
            ...[
              {
                icon: '⤴',
                label: 'Draw Cards',
                fn: () => setDrawModalId(piece.id),
              },
              {
                icon: '🗘',
                label: 'Shuffle Discarded',
                fn: () => handleShuffleDiscarded(piece.id),
              },
              {
                icon: '🞪',
                label: 'Discard Played Cards',
                fn: () => handleDiscardPlayed(piece.id),
              },
            ]
          );
          break;
      }
    }

    items.push(
      ...[
        {
          icon: '🞤',
          label: 'Zoom In',
          fn: () => tableRef.current && tableRef.current.zoomIn(),
        },
        {
          icon: '‒',
          label: 'Zoom Out',
          fn: () => tableRef.current && tableRef.current.zoomOut(),
        },
      ]
    );
    return items;
  };

  const handleUpdatePieceUnthrottled = (piece: RenderPiece) => {
    if (!conn) {
      return;
    }
    const updatedPiece = {
      ...pieces[piece.id],
      ...piece,
      delta: pieces[piece.id].delta + 1,
    };

    setPieces(p => ({
      ...p,
      [piece.id]: updatedPiece,
    }));

    conn.send({
      event: 'update_piece',
      pieces: {
        [piece.id]: updatedPiece,
      },
    });
  };

  const handleUpdatePiece = _.throttle(handleUpdatePieceUnthrottled, 200);

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
      setName(name);
      setShowRenameModal(false);
    }
  };

  const handlePlayCards = (cardIds: string[], faceDown: boolean) => {
    if (!conn) {
      return;
    }
    conn.send({
      cardIds,
      faceDown,
      event: 'play_cards',
    });
    if (window.innerWidth < maxMobileWidth) {
      setShowPlayerControls(false);
    }
  };

  const handlePassCards = (cardIds: string[], playerId: string) => {
    if (!conn) {
      return;
    }
    conn.send({
      cardIds,
      playerId,
      event: 'pass_cards',
    });
    if (window.innerWidth < maxMobileWidth) {
      setShowPlayerControls(false);
    }
  };

  const handleDrawCardsToTable = (faceDown: boolean) => (count: number) => {
    if (!conn) {
      return;
    }
    conn.send({
      faceDown,
      count,
      deckId: drawModalId,
      event: 'draw_cards_to_table',
    });
    setDrawModalId('');
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
    setShowPlayerControls(true);
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

  const player = Object.values(pieces).find(
    p => p.type === 'player' && p.playerId === playerId
  );

  const layers = board.reduce((agg: RenderPiece[][], pieceId: string) => {
    const piece = pieces[pieceId];
    if (piece) {
      agg[piece.layer] = agg[piece.layer] || [];
      agg[piece.layer].push(piece);
    }
    return agg;
  }, []);

  if (!gameId) {
    return <Redirect to="/" />;
  }

  return (
    <MainContainer>
      <AppContainer>
        <Table ref={tableRef}>
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
                            isSelected={piece.id === selectedPieceId}
                            onSelect={handleSelectPiece(piece.id)}
                            onDblClick={() => setDrawModalId(piece.id)}
                          />
                        );

                      // Board
                      case 'card':
                        return (
                          <ImagePiece
                            key={piece.id}
                            assets={assets}
                            piece={
                              piece.faceDown
                                ? {
                                    ...piece,
                                    image: pieces[piece.deckId].image,
                                  }
                                : piece
                            }
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
                        return piece.playerId ? (
                          <PlayArea
                            key={piece.id}
                            piece={piece}
                            handCount={handCounts[piece.playerId]}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                          />
                        ) : null;

                      default:
                        return null;
                    }
                  })}
                </Layer>
              )
          )}
        </Table>

        <TogglePlayerContainerButton
          onClick={() => setShowPlayerControls(!showPlayerControls)}
        >
          {showPlayerControls ? <>&rsaquo;</> : <>&lsaquo;</>}
        </TogglePlayerContainerButton>

        {showPlayerControls && (
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
                pieces={pieces}
                hand={myHand}
                playCards={handlePlayCards}
                passCards={handlePassCards}
                discard={handleDiscard}
                players={
                  Object.values(pieces).filter(
                    p =>
                      p.type === 'player' &&
                      p.playerId &&
                      p.playerId !== (player || {}).playerId
                  ) as PlayerPiece[]
                }
              />
            </HandContainer>
            <PlayerLinksContainer>
              <Button
                design="primary"
                onClick={() => setShowControlsModal(true)}
              >
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
        )}

        {drawModalId && (
          <DeckModal
            onDrawCards={handleDrawCards}
            onPlayFaceUp={handleDrawCardsToTable(false)}
            onPlayFaceDown={handleDrawCardsToTable(true)}
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
            hostId={hostId}
            gameId={gameId}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </AppContainer>

      <ControlsMenu items={pieceControls(pieces[selectedPieceId || ''])} />

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
