import React from 'react';
import styled from 'styled-components';
import * as _ from 'lodash';
import { useParams, Link, Redirect } from 'react-router-dom';
import {
  FaExpand,
  FaSlidersH,
  FaCommentDots,
  FaEye,
  FaTimes,
  FaLevelUpAlt,
  FaPlus,
  FaMinus,
  FaDiceFive,
  FaRandom,
  FaSync,
} from 'react-icons/fa';

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
import {
  RenderPiece,
  PlayerPiece,
  DiceSet,
  DicePiece,
  CircleTokenPiece,
  BoardPiece,
  CardPiece,
  ImageTokenPiece,
  RectTokenPiece,
  DeckPiece,
} from '../../types';
import { Layer } from 'react-konva';
import { ImagePiece, Deck, RectPiece, CirclePiece, Die } from '../Piece';
import { PlayArea } from '../Piece/PlayArea';
import { ControlsMenu, ControlsMenuItem } from '../ControlsMenu';
import { DiceModal } from '../DiceModal';
import { Chat } from '../Chat';
import { SettingsModal } from '../SettingsModal';
// import { DeckPeekModal } from '../DeckPeekModal/DeckPeekModal';

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

const UnreadIcon = styled(FaCommentDots)({
  // display: 'inline-block',
  // textAlign: 'center',
  color: '#e74c3c',
  // color: '#fff',
  // height: '20px',
  // width: '20px',
  // borderRadius: '20px',
});

export const App: React.FC = () => {
  const { gameId = '', hostId = '' } = useParams();
  const {
    playerId,
    conn,
    config,
    chat,
    pieces,
    board,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    setPieces,
    failedConnection,
    // TODO
    // myDice,
    // diceCounts,
    // peekingPlayers,
    // peekingCards,
    // peekingDiscardedCards,
  } = useGameClient(gameId, hostId);
  const fact = React.useMemo(() => _.sample(facts), []);
  const [selectedPieceId, setSelectedPieceId] = React.useState<string | null>();
  const [showPlayerControls, setShowPlayerControls] = React.useState<boolean>(
    true
  );
  const [drawModalId, setDrawModalId] = React.useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = React.useState<boolean>(
    false
  );
  const [showRenameModal, setShowRenameModal] = React.useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = React.useState<boolean>(false);
  const [showDiceModal, setShowDiceModal] = React.useState<boolean>(false);
  const [lastReadChat, setLastReadChat] = React.useState<number>(0);
  const [showChat, setShowChat] = React.useState<boolean>(false);
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

  React.useEffect(() => {
    if (showChat) {
      setLastReadChat(chat.length);
    }
  }, [chat.length, showChat]);

  const pieceControls = (
    piece: RenderPiece | undefined
  ): ControlsMenuItem[] => {
    const items = [
      {
        icon: chat.length > lastReadChat ? <UnreadIcon /> : <FaCommentDots />,
        label:
          chat.length > lastReadChat
            ? `Chat (${chat.length - lastReadChat})`
            : `Chat`,
        fn: () => setShowChat(true),
      },
    ];

    if (piece) {
      switch (piece.type) {
        case 'die':
          if (piece.hidden) {
            items.push(
              ...[
                {
                  icon: <FaEye />,
                  label: 'Reveal',
                  fn: () => {}, // TODO
                },
              ]
            );
          } else {
            items.push(
              ...[
                {
                  icon: <FaTimes />,
                  label: 'Remove',
                  fn: () =>
                    handleUpdatePiece({ id: piece.id, type: 'deleted' }),
                },
              ]
            );
          }
          break;

        case 'card':
          items.push(
            ...[
              {
                icon: <FaSync />,
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
                icon: <FaLevelUpAlt />,
                label: 'Draw Cards',
                fn: () => setDrawModalId(piece.id),
              },
              // TODO
              // {
              //   icon: 'FaEye',
              //   label: 'Peek At Deck',
              //   fn: () => {
              //     handlePeekAtDeck(piece.id, true);
              //   },
              // },
              {
                icon: <FaRandom />,
                label: 'Shuffle Discarded',
                fn: () => handleShuffleDiscarded(piece.id),
              },
              {
                icon: <FaTimes />,
                label: 'Discard Played Cards',
                fn: () => handleDiscardPlayed(piece.id),
              },
            ]
          );
          break;
      }
    } else {
      items.push(
        ...[
          {
            icon: <FaDiceFive />,
            label: 'Roll Dice',
            fn: () => setShowDiceModal(true),
          },
        ]
      );
    }

    items.push(
      ...[
        {
          icon: <FaPlus />,
          label: 'Zoom In',
          fn: () => tableRef.current && tableRef.current.zoomIn(),
        },
        {
          icon: <FaMinus />,
          label: 'Zoom Out',
          fn: () => tableRef.current && tableRef.current.zoomOut(),
        },
        // TODO
        // {
        //   icon: 'FaCrosshair',
        //   label: 'Reset Zoom',
        //   fn: () => tableRef.current && tableRef.current.resetZoom(),
        // },
        {
          icon: <FaExpand />,
          label: 'Toggle Fullscreen',
          fn: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }
          },
        },
        {
          icon: <FaSlidersH />,
          label: 'Settings',
          fn: () => setShowSettingsModal(true),
        },
      ]
    );
    return items;
  };

  // const handleRevealPieces = (pieceIds: string[]) => {
  //   if (conn) {
  //     conn.send({
  //       pieceIds,
  //       event: 'reveal_pieces',
  //     });
  //   }
  // };

  const handleUpdatePieceUnthrottled = React.useCallback(
    (piece: RenderPiece) => {
      if (!conn) {
        return;
      }
      setPieces(p => ({
        ...p,
        [piece.id]: piece,
      }));

      conn.send({
        event: 'update_piece',
        pieces: {
          [piece.id]: piece,
        },
      });
    },
    [conn, setPieces]
  );
  let handleUpdatePieceRef = React.useRef<(piece: RenderPiece) => void>();
  const handleUpdatePiece = (piece: Partial<RenderPiece> & { id: string }) => {
    if (handleUpdatePieceRef.current) {
      if (!pieces[piece.id]) {
        console.log('piece not found');
        return;
      }
      const curPiece = pieces[piece.id];
      const updatedPiece = {
        ...curPiece,
        ...piece,
        delta: curPiece.delta + 1,
      } as RenderPiece;

      handleUpdatePieceRef.current(updatedPiece);
    }
  };

  const handlePickUpCard = (id: string) => () => {
    if (conn) {
      conn.send({
        event: 'pick_up_cards',
        cardIds: [id],
      });
    }
  };

  // TODO
  // const handlePeekAtDeck = (deckId: string, peeking: boolean) => {
  //   if (conn) {
  //     conn.send({
  //       deckId,
  //       peeking,
  //       event: 'peek_at_deck',
  //     });
  //   }
  // };

  const handleRollDice = (dice: DiceSet, hidden: boolean) => {
    if (conn) {
      conn.send({
        hidden,
        dice,
        event: 'roll_dice',
      });
      setShowDiceModal(false);
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

  const handleOnChat = (message: string) => {
    if (conn) {
      conn.send({
        playerId,
        message,
        event: 'chat',
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

  React.useEffect(() => {
    if (conn && !handleUpdatePieceRef.current) {
      handleUpdatePieceRef.current = _.throttle(
        handleUpdatePieceUnthrottled,
        100,
        { leading: false }
      );
    }
  }, [conn, handleUpdatePieceUnthrottled]);

  const players = Object.values(pieces).filter(
    p => p.type === 'player'
  ) as PlayerPiece[];
  const player = players.find(p => p.playerId === playerId);

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
                            piece={piece as BoardPiece}
                          />
                        );

                      // Deck
                      case 'deck':
                        return (
                          <Deck
                            key={piece.id}
                            assets={assets}
                            piece={piece as DeckPiece}
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
                              (piece.faceDown
                                ? {
                                    ...piece,
                                    image: pieces[piece.deckId].image,
                                  }
                                : piece) as CardPiece
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
                            piece={piece as ImageTokenPiece}
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
                            piece={piece as RectTokenPiece}
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
                            piece={piece as CircleTokenPiece}
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
                            piece={piece as PlayerPiece}
                            handCount={handCounts[piece.playerId]}
                            onChange={p =>
                              handleUpdatePiece({ ...piece, ...p })
                            }
                          />
                        ) : null;

                      // Dice
                      case 'die':
                        return (
                          <Die
                            key={piece.id}
                            draggable={true}
                            piece={piece as DicePiece}
                            isSelected={piece.id === selectedPieceId}
                            onSelect={handleSelectPiece(piece.id)}
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

              <Link to="/games" className="u-pull-right">
                <Button design="danger">Leave Game</Button>
              </Link>
            </PlayerLinksContainer>
          </PlayerContainer>
        )}
      </AppContainer>

      <ControlsMenu items={pieceControls(pieces[selectedPieceId || ''])} />

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

      {showDiceModal && (
        <DiceModal
          onClose={() => setShowDiceModal(false)}
          onRollDice={handleRollDice}
        />
      )}

      {showChat && (
        <Chat
          players={players}
          chat={chat}
          onChat={handleOnChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          playerId={playerId}
          config={config}
          assets={assets}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* {(peekingCards.length || peekingDiscardedCards.length) && (
        <DeckPeekModal
          pieces={pieces}
          assets={assets}
          cards={peekingCards}
          discarded={peekingDiscardedCards}
          onTakeCards={() => {}}
          onClose={() => handlePeekAtDeck('', false)}
        />
      )} */}

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
            <Link to="/games">Leave Game</Link>
          </LoadingContainer>
        </LoadingPage>
      )}
    </MainContainer>
  );
};
