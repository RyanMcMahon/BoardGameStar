import React, { ReactNode } from 'react';
import styled from 'styled-components';
import {
  FaExpand,
  FaSlidersH,
  FaCommentDots,
  FaTrashAlt,
  FaLock,
  FaLockOpen,
  FaEye,
  FaTimes,
  FaLevelUpAlt,
  FaPlus,
  FaMinus,
  FaDiceFive,
  FaRandom,
  FaSync,
} from 'react-icons/fa';

import { maxMobileWidth, theShadow } from '../../utils/style';
import { RenderPiece, ChatEvent } from '../../types';

export interface ControlsMenuItem {
  icon: ReactNode;
  label: string;
  fn: () => void;
}

interface Props {
  selectedPieces: RenderPiece[];
  // items: ControlsMenuItem[];
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
  // display: 'inline-block',
  // textAlign: 'center',
  color: '#e74c3c',
  // color: '#fff',
  // height: '20px',
  // width: '20px',
  // borderRadius: '20px',
});

export function ControlsMenu(props: Props) {
  const {
    selectedPieces,
    chat,
    lastReadChat,
    allUnlocked,
    onShowChat,
    onUpdatePieces,
    onShowDrawModal,
    onShuffleDiscarded,
    onDiscardPlayed,
    onClearSelectedPieces,
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
                // setSelectedPieceIds(new Set());
              },
            },
          ]
        );
        // }
        break;

      case 'card':
        items.push(
          ...[
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
