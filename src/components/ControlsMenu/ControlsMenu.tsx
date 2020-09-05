import React, { ReactNode } from 'react';
import styled from 'styled-components';
import {
  FaBan,
  FaExpand,
  FaSlidersH,
  FaCommentDots,
  FaTrashAlt,
  FaLock,
  FaLockOpen,
  // FaEye,
  FaTimes,
  FaLevelUpAlt,
  FaPlus,
  FaMinus,
  FaDiceFive,
  FaRandom,
  FaSync,
  FaMoneyBillAlt,
  FaEye,
} from 'react-icons/fa';

import { maxMobileWidth, theShadow } from '../../utils/style';
import { RenderPiece, ChatEvent, Pieces, StackPiece } from '../../types';

export interface ControlsMenuItem {
  icon: ReactNode;
  label: string;
  fn: () => void;
}

interface Props {
  playerId: string;
  selectedPieces: RenderPiece[];
  pieces: Pieces;
  chat: ChatEvent[];
  lastReadChat: number;
  onShowChat: () => void;
  allUnlocked: boolean;
  onUpdatePieces: (
    updatedPieces: RenderPiece[],
    throttled?: boolean | undefined
  ) => void;
  onShowDrawModal: (deckId: string) => void;
  onShuffleDiscarded: (deckId: string) => void;
  onDiscardPlayed: (deckId: string) => void;
  onDiscardSelected: (cardIds: string[]) => void;
  onPickUpSelected: (cardIds: string[]) => void;
  onPeekAtCards: (cardIds: string[]) => void;
  onPromptTransaction: (bankId: string) => void;
  onClearSelectedPieces: () => void;
  onShowDiceModal: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onShowSettingsModal: () => void;
}

const ControlsContainer = styled.div({
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 500,
  backgroundColor: '#fff',
  borderRadius: '0 4px 4px 0',
  boxShadow: theShadow,
  padding: '.5rem 0',
});

const ControlsItem = styled.div({
  cursor: 'pointer',
  padding: '.5rem 1rem',
  fontSize: '2rem',
  userSelect: 'none',
  ':hover': {
    backgroundColor: '#eee',
  },
});

const Icon = styled.span({
  display: 'inline-block',
  width: '30px',
  marginRight: '.5rem',
  textAlign: 'center',
  position: 'relative',
  top: '3px',
});

const ExpandIcon = styled.span({
  position: 'relative',
  fontSize: '4rem',
  lineHeight: '2rem',
  top: '3px',
  left: '9px',
  marginRight: '23px',
});

const UnreadIcon = styled(FaCommentDots)({
  color: '#e74c3c',
});

export function ControlsMenu(props: Props) {
  const {
    // playerId,
    pieces,
    selectedPieces,
    chat,
    lastReadChat,
    allUnlocked,
    onShowChat,
    onUpdatePieces,
    onShowDrawModal,
    onShuffleDiscarded,
    onDiscardPlayed,
    onDiscardSelected,
    onPickUpSelected,
    onPeekAtCards,
    onClearSelectedPieces,
    onPromptTransaction,
    onShowDiceModal,
    onZoomIn,
    onZoomOut,
    onShowSettingsModal,
  } = props;
  const [isExpanded, setIsExpanded] = React.useState(true);

  const commonType = selectedPieces.reduce(
    (type, piece) => (!type || piece.type === type ? piece.type : 'mixed'),
    ''
  );

  const items = [];

  if (selectedPieces.length && commonType !== 'mixed') {
    switch (commonType) {
      case 'die':
        // if (piece.hidden) {
        //   items.push(
        //     ...[
        //       {
        //         icon: <FaEye />,
        //         label: 'Reveal',
        //         fn: () => {}, // TODO
        //       },
        //     ]
        //   );
        // } else {
        items.push(
          ...[
            {
              icon: <FaTrashAlt />,
              label: 'Remove',
              fn: () => {
                onUpdatePieces(
                  selectedPieces.map(
                    piece =>
                      ({
                        ...piece,
                        type: 'deleted',
                      } as RenderPiece)
                  )
                );
                onClearSelectedPieces();
              },
            },
          ]
        );
        // }
        break;

      case 'stack':
        if (
          (selectedPieces as StackPiece[]).every(p =>
            p.pieces.every(c => pieces[c].back)
          )
        ) {
          items.push(
            ...[
              {
                icon: <FaSync />,
                label: 'Flip Tokens',
                fn: () =>
                  onUpdatePieces(
                    (selectedPieces as StackPiece[]).reduce(
                      (arr: StackPiece[], stack: StackPiece) => [
                        ...arr,
                        ...stack.pieces.map(
                          id =>
                            ({
                              ...pieces[id],
                              flipped: !pieces[stack.pieces.slice(-1)[0]]
                                .flipped,
                            } as StackPiece)
                        ),
                      ],
                      selectedPieces.map(
                        p => ({ ...p, delta: p.delta + 1 } as StackPiece)
                      )
                    )
                  ),
              },
            ]
          );
        }
        break;

      case 'image':
        if (selectedPieces.every(p => p.back)) {
          items.push(
            ...[
              {
                icon: <FaSync />,
                label: 'Flip Token',
                fn: () =>
                  onUpdatePieces(
                    selectedPieces.map(piece => ({
                      ...piece,
                      flipped: !piece.flipped,
                    }))
                  ),
              },
            ]
          );
        }
        break;

      case 'money':
        if (selectedPieces.length === 1) {
          items.push(
            ...[
              {
                icon: <FaMoneyBillAlt />,
                label: 'Transaction',
                fn: () => onPromptTransaction(selectedPieces[0].id),
              },
            ]
          );
        }
        break;

      case 'card':
        items.push(
          ...[
            {
              icon: <FaLevelUpAlt />,
              label: 'Pick Up Cards',
              fn: () => onPickUpSelected(selectedPieces.map(piece => piece.id)),
            },
            {
              icon: <FaSync />,
              label: 'Flip Card',
              fn: () =>
                onUpdatePieces(
                  selectedPieces.map(piece => ({
                    ...piece,
                    faceDown: !piece.faceDown,
                  }))
                ),
            },
            ...(selectedPieces.every(p => p.faceDown)
              ? [
                  {
                    icon: <FaEye />,
                    label: 'Peek',
                    fn: () => onPeekAtCards(selectedPieces.map(p => p.id)),
                  },
                ]
              : []),
            {
              icon: <FaBan />,
              label: 'Discard',
              fn: () =>
                onDiscardSelected(selectedPieces.map(piece => piece.id)),
            },
          ]
        );
        break;

      case 'deck':
        if (selectedPieces.length === 1) {
          items.push(
            ...[
              {
                icon: <FaLevelUpAlt />,
                label: 'Draw Cards',
                fn: () => onShowDrawModal(selectedPieces[0].id),
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
                fn: () => onShuffleDiscarded(selectedPieces[0].id),
              },
              {
                icon: <FaTimes />,
                label: 'Discard Played Cards',
                fn: () => onDiscardPlayed(selectedPieces[0].id),
              },
            ]
          );
        }
        break;
    }
  }

  if (selectedPieces.length) {
    items.push(
      ...[
        {
          icon: allUnlocked ? <FaLock /> : <FaLockOpen />,
          label: allUnlocked ? 'Lock' : 'Unlock',
          fn: () =>
            onUpdatePieces(
              selectedPieces.map(piece => ({
                ...piece,
                locked: allUnlocked,
              }))
            ),
        },
        {
          icon: <FaTimes />,
          label: 'Clear Selection',
          fn: onClearSelectedPieces,
        },
      ]
    );
  } else {
    items.push(
      ...[
        {
          icon: chat.length > lastReadChat ? <UnreadIcon /> : <FaCommentDots />,
          label:
            chat.length > lastReadChat
              ? `Chat (${chat.length - lastReadChat})`
              : `Chat`,
          fn: onShowChat,
        },

        {
          icon: <FaDiceFive />,
          label: 'Roll Dice',
          fn: onShowDiceModal,
        },
        {
          icon: <FaPlus />,
          label: 'Zoom In',
          fn: onZoomIn,
        },
        {
          icon: <FaMinus />,
          label: 'Zoom Out',
          fn: onZoomOut,
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
          fn: onShowSettingsModal,
        },
      ]
    );
  }

  React.useLayoutEffect(() => {
    if (document.documentElement.clientWidth < maxMobileWidth) {
      setIsExpanded(false);
    }
  }, []);

  return (
    <ControlsContainer>
      <ControlsItem onClick={() => setIsExpanded(!isExpanded)}>
        <ExpandIcon> {isExpanded ? <>&lsaquo;</> : <>&rsaquo;</>}</ExpandIcon>
        {isExpanded && <>Collapse</>}
      </ControlsItem>
      {items.map(item => (
        <ControlsItem key={item.label} onClick={item.fn}>
          <Icon>{item.icon}</Icon>
          {isExpanded && <>{item.label}</>}
        </ControlsItem>
      ))}
    </ControlsContainer>
  );
}
