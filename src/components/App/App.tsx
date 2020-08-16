import React from 'react';
import styled from 'styled-components';
import * as _ from 'lodash';
// import FPSStats from 'react-fps-stats';
import { Viewport } from 'pixi-viewport';
import { useParams, Link, Redirect } from 'react-router-dom';

import { useGameClient } from '../../utils/client';
// import { breakpoints, maxMobileWidth } from '../../utils/style';
import { Table, useTable } from '../../utils/useTable';
import { ControlsModal } from '../ControlsModal';
import { InviteModal } from '../InviteModal';

import { PlayerHand } from '../PlayerHand';
import { DeckModal } from '../DeckModal';
import { TransactionModal } from '../TransactionModal';
import { RenameModal } from '../RenameModal';
import { ProgressBar } from '../ProgressBar';
import { facts } from '../../utils/facts';
import { setName } from '../../utils/identity';
import {
  RenderPiece,
  PlayerPiece,
  DiceSet,
  Transaction,
  GamePrompt,
  GamePromptAnswer,
} from '../../types';
import { ControlsMenu } from '../ControlsMenu';
import { DiceModal } from '../DiceModal';
import { Chat } from '../Chat';
import { SettingsModal } from '../SettingsModal';
import { AppContext, initialState, appReducer } from './AppContext';
import { PromptSelectModal } from '../PromptSelectModal';
// import { config } from 'process';
import { PlayerPromptModal } from '../PlayerPromptModal/PlayerPromptModal';
import { DeckPeekModal } from '../DeckPeekModal';
import { supportedBrowser } from '../../utils/meta';

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

const LoadingPage = styled.div({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: '#fff',
  zIndex: 90000,
});

const BrowserSupportBanner = styled.div({
  color: '#e74c3c',
  fontWeight: 'bold',
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

const tableConfig = {
  board: {},
  deck: {
    selectable: true,
    draggable: true,
    rotatable: true,
  },
  card: {
    selectable: true,
    draggable: true,
    rotatable: true,
  },
  money: {
    selectable: true,
    draggable: true,
  },
  image: {
    selectable: true,
    draggable: true,
    rotatable: true,
  },
  rect: {
    selectable: true,
    draggable: true,
    rotatable: true,
  },
  circle: {
    selectable: true,
    draggable: true,
  },
  die: {
    selectable: true,
    draggable: true,
  },
  player: {
    draggable: true,
  },
  stack: {
    selectable: true,
    draggable: true,
  },
};

export function App(props: { spectator?: boolean }) {
  const [state, dispatch] = React.useReducer(appReducer, initialState);
  const { gameId = '', hostId = '' } = useParams();
  const {
    playerId,
    conn,
    isLoaded,
    game,
    chat,
    pieces,
    board,
    myHand,
    assets,
    percentLoaded,
    handCounts,
    updatePieces,
    failedConnection,
    activePrompts,
    promptResults,
    clearPrompt,
    renderCount,
    // TODO
    // myDice,
    // diceCounts,
    // peekingPlayers,
    // peekingCards,
    // peekingDiscardedCards,
  } = useGameClient(gameId, hostId, props.spectator);
  const players = Object.values(pieces).filter(
    p => p.type === 'player' && p.playerId
  ) as PlayerPiece[];
  const player = players.find(p => p.playerId === playerId);
  const [showPromptSelectModal, setShowPromptSelectModal] = React.useState(
    false
  );

  let sendUpdatedPiecesRef = React.useRef<
    (updatedPieces: { [id: string]: RenderPiece }) => void
  >();

  const sendUpdatedPieces = React.useCallback(
    (updatedPiecesById: { [id: string]: RenderPiece }) => {
      if (!conn) {
        return;
      }
      conn.send({
        event: 'update_piece',
        pieces: updatedPiecesById,
      });
    },
    [conn]
  );

  const handleUpdatePieces = (updatedPieces: RenderPiece[]) => {
    const updatedPiecesById = _.keyBy(updatedPieces, 'id');
    const [mainPiece] = updatedPieces;

    for (let id in updatedPiecesById) {
      updatedPiecesById[id].delta = pieces[id].delta + 1;
    }

    if (updatedPieces.length === 1 && selectedPieceIds.has(mainPiece.id)) {
      const otherPieceIds = Array.from(selectedPieceIds).filter(
        id => id !== mainPiece.id
      );
      const diff = {
        x: mainPiece.x - pieces[mainPiece.id].x,
        y: mainPiece.y - pieces[mainPiece.id].y,
      };

      otherPieceIds.forEach(id => {
        updatedPiecesById[id] = {
          ...pieces[id],
          x: diff.x + pieces[id].x,
          y: diff.y + pieces[id].y,
          delta: pieces[id].delta + 1,
        };
      });
    }

    updatePieces(updatedPiecesById);

    sendUpdatedPieces(updatedPiecesById);
  };

  const handleUpdatePiece = (piece: Partial<RenderPiece> & { id: string }) => {
    const curPiece = pieces[piece.id];
    if (!curPiece) {
      return;
    }

    const updatedPieces: RenderPiece[] = [
      {
        ...curPiece,
        ...piece,
        delta: curPiece.delta + 1,
      } as RenderPiece,
    ];

    handleUpdatePieces(updatedPieces);
  };

  const handlePickUpCards = (ids: string[]) => {
    if (conn) {
      conn.send({
        event: 'pick_up_cards',
        cardIds: ids,
      });
      const selectedIds = new Set(selectedPieceIds);
      ids.forEach(id => {
        selectedIds.delete(id);
      });
      setSelectedPieceIds(selectedIds);
    }
  };

  const handleCreateStack = (ids: string[]) => {
    if (conn) {
      conn.send({
        ids,
        event: 'create_stack',
      });

      setSelectedPieceIds(new Set());
    }
  };

  const handleSplitStack = (id: string, count: number) => {
    if (conn) {
      conn.send({
        id,
        count,
        event: 'split_stack',
      });
      setSelectedPieceIds(new Set());
    }
  };

  const handleSubmitTransaction = (
    transaction: Transaction,
    amount: number
  ) => {
    if (conn) {
      conn.send({
        event: 'transaction',
        transaction,
        amount,
      });
      setSelectedPieceIds(new Set());
      setTransactionModalOptions(null);
    }
  };

  const handlePeekAtCard = (cardIds: string[], peeking: boolean) => {
    if (conn) {
      conn.send({
        peeking,
        cardIds,
        event: 'peek_at_card',
      });
    }
  };

  const handleSelectPrompt = (prompt: GamePrompt, players: string[]) => {
    if (conn) {
      conn.send({
        event: 'prompt_players',
        prompt,
        players,
      });
      setShowPromptSelectModal(false);
    }
  };

  const handleSubmitAnswers = (answers?: GamePromptAnswer[]) => {
    if (conn) {
      conn.send({
        answers,
        event: 'prompt_submission',
        promptId: activePrompts[0].prompt.id || '',
      });
      setShowPromptSelectModal(false);
    }
  };

  const handlePromptTransaction = (id: string) => {
    if (!player) {
      return;
    }

    const bank = pieces[id];
    setTransactionModalOptions([
      {
        to: {
          id: player.id,
          name: 'You',
        },
        from: {
          id,
          name: 'Bank',
          max: bank.balance,
        },
      },
      {
        from: {
          id: player.id,
          name: 'You',
          max: bank.balance,
        },
        to: {
          id,
          name: 'Bank',
        },
      },
      {
        from: {
          id,
          name: 'Bank',
          max: bank.balance,
        },
        to: {
          name: 'New Bank',
        },
      },
    ]);
  };

  const table = useTable({
    spectator: props.spectator,
    handleCreateStack,
    handleSplitStack,
    handleUpdatePiece,
    handleSubmitTransaction,
    assets,
    // handCounts,
    config: tableConfig,
    onDblClickDeck: (id: string) => setDrawModalId(id),
    onDblClickCard: (id: string) => handlePickUpCards([id]),
    onDblClickMoney: handlePromptTransaction,
  });
  const fact = React.useMemo(() => _.sample(facts), []);
  const {
    setSelectedPieceIds,
    selectedPieceIds,
    setRenderCount,
    container,
    setPieces: setTablePieces,
  } = table;
  // const [showPlayerControls, setShowPlayerControls] = React.useState<boolean>(
  //   true
  // );
  const [drawModalId, setDrawModalId] = React.useState<string>('');
  const [transactionModalOptions, setTransactionModalOptions] = React.useState<
    Transaction[] | null
  >(null);
  const [showSettingsModal, setShowSettingsModal] = React.useState<boolean>(
    false
  );
  const [showRenameModal, setShowRenameModal] = React.useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = React.useState<boolean>(true);
  const [showDiceModal, setShowDiceModal] = React.useState<boolean>(false);
  const [lastReadChat, setLastReadChat] = React.useState<number>(0);
  const [showChat, setShowChat] = React.useState<boolean>(false);
  const [showControlsModal, setShowControlsModal] = React.useState<boolean>(
    false
  );
  const selectedPieces = Array.from(selectedPieceIds)
    .map(id => pieces[id])
    .filter(p => p.type !== 'deleted');
  const allUnlocked = selectedPieces.every(piece => !piece.locked);
  const peekingCards = Object.values(pieces)
    .filter(
      piece => piece.type === 'card' && (piece.peeking || []).includes(playerId)
    )
    .map(c => c.id);

  // React.useLayoutEffect(() => {
  //   if (document.documentElement.clientWidth < maxMobileWidth) {
  //     setShowPlayerControls(false);
  //   }
  // }, []);

  React.useEffect(() => {
    if (showChat) {
      setLastReadChat(chat.length);
    }
  }, [chat.length, showChat]);

  // const handleRevealPieces = (pieceIds: string[]) => {
  //   if (conn) {
  //     conn.send({
  //       pieceIds,
  //       event: 'reveal_pieces',
  //     });
  //   }
  // };

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
    // if (document.documentElement.clientWidth < maxMobileWidth) {
    //   setShowPlayerControls(false);
    // }
    setSelectedPieceIds(new Set());
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
    // if (document.documentElement.clientWidth < maxMobileWidth) {
    //   setShowPlayerControls(false);
    // }
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
    setSelectedPieceIds(new Set());
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
    // setShowPlayerControls(true);
    setSelectedPieceIds(new Set());
  };

  const handleDiscard = (cardIds: string[]) => {
    if (conn) {
      const remainingSelected = new Set(selectedPieceIds);
      cardIds.forEach(id => remainingSelected.delete(id));
      setSelectedPieceIds(remainingSelected);
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
    setSelectedPieceIds(new Set());
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

  const handlePromptRename = () => {
    setShowRenameModal(true);
  };

  React.useEffect(() => {
    if (conn && !sendUpdatedPiecesRef.current) {
      sendUpdatedPiecesRef.current = _.throttle(sendUpdatedPieces, 50, {
        leading: false,
      });
    }
  }, [conn, sendUpdatedPieces]);

  React.useEffect(() => {
    setTablePieces(
      board
        .map(id => {
          try {
            const piece = pieces[id];
            if (piece.type === 'player' && piece.playerId) {
              return {
                ...piece,
                label: `${piece.name} (${handCounts[piece.playerId] ||
                  0} cards in hand)`,
              };
            } else if (piece.type === 'stack') {
              return {
                ...pieces[piece.pieces.slice(-1)[0]],
                id: piece.id,
                x: piece.x,
                y: piece.y,
                pieces: piece.pieces,
                delta: piece.delta,
                counts: piece.counts,
              };
            } else {
              return pieces[id];
            }
          } catch (err) {
            return {} as any;
          }
        })
        .filter(
          piece =>
            (piece.type === 'player' && piece.playerId) ||
            (piece.type !== 'player' &&
              (!piece.counts ||
                piece.type === 'card' ||
                players.length >= parseInt(piece.counts.split(':')[0], 10)))
        )
    );
    setRenderCount(renderCount); // Force re-render
  }, [
    board,
    pieces,
    players.length,
    setTablePieces,
    handCounts,
    renderCount,
    setRenderCount,
  ]);

  if (!gameId) {
    return <Redirect to="/" />;
  }

  return (
    <MainContainer>
      <AppContainer>
        <AppContext.Provider value={{ state, dispatch }}>
          {isLoaded && <Table ref={table.stageRef} />}
        </AppContext.Provider>
        {/* 
        <TogglePlayerContainerButton
          onClick={() => setShowPlayerControls(!showPlayerControls)}
        >
          {showPlayerControls ? <>&rsaquo;</> : <>&lsaquo;</>}
        </TogglePlayerContainerButton> */}

        {!props.spectator && game && (
          <PlayerHand
            config={game.config}
            assets={assets}
            pieces={pieces}
            hand={myHand}
            onRename={handlePromptRename}
            playCards={handlePlayCards}
            passCards={handlePassCards}
            discard={handleDiscard}
            promptTransaction={setTransactionModalOptions}
            onPromptPlayers={() => setShowPromptSelectModal(true)}
            player={player}
            players={
              Object.values(pieces).filter(
                p =>
                  p.type === 'player' &&
                  p.playerId &&
                  p.playerId !== (player || {}).playerId
              ) as PlayerPiece[]
            }
          />
        )}
      </AppContainer>

      {!props.spectator && (
        <ControlsMenu
          playerId={playerId}
          pieces={pieces}
          selectedPieces={selectedPieces}
          chat={chat}
          lastReadChat={lastReadChat}
          onShowChat={() => setShowChat(true)}
          allUnlocked={allUnlocked}
          onUpdatePieces={handleUpdatePieces}
          onShowDrawModal={setDrawModalId}
          onShuffleDiscarded={handleShuffleDiscarded}
          onDiscardPlayed={handleDiscardPlayed}
          onDiscardSelected={handleDiscard}
          onPickUpSelected={handlePickUpCards}
          onPromptTransaction={handlePromptTransaction}
          onClearSelectedPieces={() => setSelectedPieceIds(new Set())}
          onShowDiceModal={() => setShowDiceModal(true)}
          onZoomIn={() => container && (container as Viewport).zoom(-200)}
          onZoomOut={() => container && (container as Viewport).zoom(200)}
          onShowSettingsModal={() => setShowSettingsModal(true)}
          onPeekAtCards={(cardIds: string[]) => handlePeekAtCard(cardIds, true)}
        />
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
          playerId={playerId}
          players={players}
          hostId={hostId}
          game={game}
          onRename={handleRename}
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
          playerId={playerId}
          onClose={() => setShowChat(false)}
          onRename={() => setShowRenameModal(true)}
        />
      )}

      {game && showSettingsModal && (
        <SettingsModal
          playerId={playerId}
          config={game}
          assets={assets}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {transactionModalOptions && (
        <TransactionModal
          transactions={transactionModalOptions}
          onClose={() => setTransactionModalOptions(null)}
          onSubmit={handleSubmitTransaction}
        />
      )}

      {showPromptSelectModal && (
        <PromptSelectModal
          onClose={() => setShowPromptSelectModal(false)}
          onSelectPrompt={handleSelectPrompt}
          prompts={game?.config.prompts || []}
          players={players}
        />
      )}

      {!!activePrompts.length && (
        <PlayerPromptModal
          assets={assets}
          pieces={pieces}
          hand={myHand}
          event={activePrompts[0]}
          onClose={clearPrompt}
          onSubmitAnswers={handleSubmitAnswers}
          results={promptResults[activePrompts[0].prompt.id || '']}
          players={players}
          playerId={playerId}
        />
      )}

      {!!peekingCards.length && (
        <DeckPeekModal
          pieces={pieces}
          assets={assets}
          cards={peekingCards}
          discarded={[]}
          onTakeCards={() => handlePickUpCards(peekingCards)}
          onClose={() => handlePeekAtCard(peekingCards, false)}
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

      {!isLoaded && (
        <LoadingPage>
          <LoadingContainer>
            {!supportedBrowser && (
              <BrowserSupportBanner>
                This browser may not be supported.
              </BrowserSupportBanner>
            )}
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
      {/* <FPSStats /> */}
    </MainContainer>
  );
}
