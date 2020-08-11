import React from 'react';
import styled from 'styled-components';

import { DropdownButton } from '../DropdownButton';
import { PlayerSelectModal } from '../PlayerSelectModal';
import {
  Button,
  theShadow,
  breakpoints,
  primaryColor,
} from '../../utils/style';
import {
  Card,
  Pieces,
  PlayerPiece,
  GameConfig,
  Transaction,
} from '../../types';
import { prependPrefix } from '../../utils/assets';
import { Link } from 'react-router-dom';
import {
  FaSortUp,
  FaSortDown,
  FaCheckCircle,
  FaSignOutAlt,
  FaQuestion,
  FaQuestionCircle,
} from 'react-icons/fa';

interface Props {
  config: GameConfig;
  assets: { [key: string]: string };
  pieces: Pieces;
  hand: string[];
  onRename: () => void;
  playCards: (ids: string[], faceDown: boolean) => void;
  passCards: (ids: string[], playerId: string) => void;
  promptTransaction: (transactions: Transaction[]) => void;
  onPromptPlayers: () => void;
  player: PlayerPiece | undefined;
  players: PlayerPiece[];
  discard: (ids: string[]) => void;
}

const CARD_OFFSET = 30;

const PlayerName = styled(Button)<{ color: string }>(
  (props: { color: string }) => ({
    marginLeft: '0 !important',
    background: props.color,
    ':hover': {
      background: props.color,
    },
  })
);

const AccountBalance = styled.span({
  fontSize: '20px',
  fontWeight: 'bold',
  display: 'inline-block',
  margin: '0 2rem',
  cursor: 'pointer',
  position: 'relative',
  top: '3px',
});

const HandWrapper = styled.div({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  margin: '0 auto',
  userSelect: 'none',
  maxHeight: '100vh',
  zIndex: 1000,
});

const Controls = styled.div({
  backgroundColor: '#fafafa',
  padding: '.5rem',
  [`> ${Button}`]: {
    marginLeft: '.5rem',
  },
});

const MobileHidden = styled.span({
  [breakpoints.mobile]: {
    display: 'none',
  },
});

const IconButton = styled(Button)({
  svg: {
    position: 'relative',
    top: '3px',
  },
});

const DrawerControls = styled.div({
  [`> ${Button}`]: {
    marginLeft: '.5rem',
  },
});

const ButtonControls = styled.span({
  display: 'none',
  [`> ${Button}`]: {
    marginLeft: '.5rem',
  },
  [breakpoints.mediumDesktop]: {
    display: 'inline',
  },
});

const CardDrawerButton = styled.div({
  background: '#fafafa',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '1.8rem',
  padding: '.5rem',
  svg: {
    margin: '0 1rem',
  },
  '.cardDrawerOffsetIcon': {
    position: 'relative',
    top: '8px',
  },
  [breakpoints.mediumDesktop]: {
    display: 'none',
  },
});

const CardDrawer = styled.div({
  flex: 1,
  overflowY: 'scroll',
  backgroundColor: '#fff',
  padding: '1rem',
  textAlign: 'center',
});

const CardDrawerImageWrapper = styled.div({
  position: 'relative',
  display: 'inline-block',
});

const CardDrawerImage = styled.img({
  maxWidth: '220px',
  margin: '1rem',
});

const CardDrawerImageSelect = styled(FaCheckCircle)({
  position: 'absolute',
  top: '2rem',
  right: '2rem',
  fontSize: '3rem',
  color: primaryColor,
  backgroundColor: '#fff',
  borderRadius: '3rem',
});

const CardWrapper = styled.div({
  display: 'none',
  bottom: 0,
  height: `${CARD_OFFSET * 1.5}px`,
  paddingTop: `${CARD_OFFSET}px`,
  overflow: 'hidden',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  justifyContent: 'center',
  [breakpoints.mediumDesktop]: {
    display: 'flex',
  },
});

const CardImageWrapper = styled.div<{ selected: boolean; zIndex: number }>(
  props => ({
    flexShrink: 1,
    height: `${CARD_OFFSET}px`,
    minWidth: `${CARD_OFFSET}px`,
    position: 'relative',
    cursor: 'pointer',
    top: props.selected ? `-${CARD_OFFSET}px` : 0,
    ':hover': {
      top: props.selected ? `-${CARD_OFFSET}px` : `-${CARD_OFFSET / 2}px`,
    },
  })
);

const CardImage = styled.img({
  maxWidth: '200px',
});

const HoverCard = styled.img({
  position: 'fixed',
  left: '50%',
  // top: '50%',
  bottom: `${CARD_OFFSET * 2 + 100}px`,
  transform: 'translate(-50%)', //, -50%)',
  // outline: '30px solid rgba(0, 0, 0, .3)',
  boxShadow: '0px 0px 26px 22px rgba(0,0,0,0.3)',
});

function sortCards(a: Card, b: Card) {
  if (!a || !b) {
    return 1;
  }
  if (a.image !== b.image) {
    return (a.image || '') > (b.image || '') ? 1 : -1;
  }
  return a.id > b.id ? 1 : -1;
}

export function PlayerHand(props: Props): JSX.Element {
  const {
    assets,
    hand,
    config,
    onRename,
    playCards,
    passCards,
    discard,
    promptTransaction,
    onPromptPlayers,
    pieces,
    player,
    players,
  } = props;
  const [showCardDrawer, setShowCardDrawer] = React.useState(false);
  const [showPlayerSelectModal, setShowPlayerSelectModal] = React.useState(
    false
  );
  const [selectedCards, setSelectedCards] = React.useState<string[]>([]);
  const [hoverCard, setHoverCard] = React.useState<string>('');

  const handleSelectCard = (id: string) => () => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handlePlayCardsFaceUp = () => {
    playCards(selectedCards, false);
    setSelectedCards([]);
    setShowCardDrawer(false);
  };

  const handlePlayCardsFaceDown = () => {
    playCards(selectedCards, true);
    setSelectedCards([]);
    setShowCardDrawer(false);
  };

  const handlePassCards = (playerId: string) => {
    passCards(selectedCards, playerId);
    setSelectedCards([]);
    setShowPlayerSelectModal(false);
    setShowCardDrawer(false);
  };

  const handleDiscard = () => {
    discard(selectedCards);
    setSelectedCards([]);
    setShowCardDrawer(false);
  };

  return (
    <>
      <HandWrapper>
        {hoverCard && <HoverCard src={hoverCard} alt="" />}
        <CardDrawerButton onClick={() => setShowCardDrawer(!showCardDrawer)}>
          {!showCardDrawer ? (
            <FaSortUp className="cardDrawerOffsetIcon" />
          ) : (
            <FaSortDown />
          )}
          {hand.length} Cards In Hand
          {!showCardDrawer ? (
            <FaSortUp className="cardDrawerOffsetIcon" />
          ) : (
            <FaSortDown />
          )}
        </CardDrawerButton>
        {showCardDrawer && (
          <CardDrawer>
            <DrawerControls>
              <DropdownButton
                items={[
                  {
                    label: 'Play Face Down',
                    fn: handlePlayCardsFaceDown,
                  },
                  {
                    label: 'Pass to Player',
                    fn: () => setShowPlayerSelectModal(true),
                  },
                ]}
                disabled={!selectedCards.length}
              >
                <Button
                  design="primary"
                  onClick={handlePlayCardsFaceUp}
                  disabled={!selectedCards.length}
                >
                  Play
                </Button>
              </DropdownButton>

              <Button
                design="danger"
                onClick={handleDiscard}
                disabled={!selectedCards.length}
              >
                discard
              </Button>
            </DrawerControls>

            {hand
              .map(id => pieces[id] as Card)
              .filter(x => x)
              .sort(sortCards)
              .map(
                (card, index) =>
                  card.image && (
                    <CardDrawerImageWrapper>
                      <CardDrawerImage
                        key={card.id}
                        onClick={handleSelectCard(card.id)}
                        src={assets[card.image]}
                        alt="card"
                      />
                      {selectedCards.includes(card.id) && (
                        <CardDrawerImageSelect />
                      )}
                    </CardDrawerImageWrapper>
                  )
              )}
          </CardDrawer>
        )}

        <CardWrapper>
          {hand
            .map(id => pieces[id] as Card)
            .filter(x => x)
            .sort(sortCards)
            .map(
              (card, index) =>
                card.image && (
                  <CardImageWrapper
                    key={card.id}
                    zIndex={hand.length - index}
                    onClick={handleSelectCard(card.id)}
                    onContextMenu={e => {
                      e.preventDefault();
                      e.stopPropagation(); // not necessary in my case, could leave in case stopImmediateProp isn't available?
                      // e.stopImmediatePropagation();
                      return false;
                    }}
                    onTouchStart={() => {
                      setHoverCard(assets[card.image || '']);
                    }}
                    onTouchEnd={() => setHoverCard('')}
                    onMouseEnter={() => setHoverCard(assets[card.image || ''])}
                    onMouseLeave={() => setHoverCard('')}
                    selected={selectedCards.includes(card.id)}
                  >
                    <CardImage src={assets[card.image]} alt="card" />
                  </CardImageWrapper>
                )
            )}
        </CardWrapper>
        <Controls>
          <MobileHidden>
            {player && (
              <PlayerName
                design="primary"
                color={player.color}
                onClick={onRename}
              >
                {player.name}
              </PlayerName>
            )}
          </MobileHidden>

          <IconButton design="primary" onClick={onPromptPlayers}>
            <MobileHidden>Prompt Players&nbsp;</MobileHidden>
            <FaQuestionCircle />
          </IconButton>

          <ButtonControls>
            <Button
              design="primary"
              onClick={handlePlayCardsFaceUp}
              disabled={!selectedCards.length}
            >
              Play Face Up
            </Button>
            <Button
              design="primary"
              onClick={handlePlayCardsFaceDown}
              disabled={!selectedCards.length}
            >
              Play Face Down
            </Button>
            <Button
              design="primary"
              onClick={() => setShowPlayerSelectModal(true)}
              disabled={!selectedCards.length}
            >
              Pass to Player
            </Button>

            <Button
              design="danger"
              onClick={handleDiscard}
              disabled={!selectedCards.length}
            >
              discard
            </Button>
          </ButtonControls>

          {player && (
            <AccountBalance
              onClick={() => {
                if (!players.length || !player.balance) {
                  return;
                }
                promptTransaction(
                  players.map(p => ({
                    from: {
                      type: 'player',
                      name: 'You',
                      id: player.id,
                      max: player.balance || 0,
                    },
                    to: {
                      type: 'player',
                      name: p.name,
                      id: p.id,
                    },
                  }))
                );
              }}
            >
              {config.currency ? `${config.currency}: ` : '$ '}
              {player.balance || 0}
            </AccountBalance>
          )}

          <Link to="/games" className="u-pull-right">
            <IconButton design="danger">
              <MobileHidden>Leave Game&nbsp;</MobileHidden>
              <FaSignOutAlt />
            </IconButton>
          </Link>
        </Controls>
      </HandWrapper>
      {showPlayerSelectModal && (
        <PlayerSelectModal
          players={players}
          onSelect={handlePassCards}
          onClose={() => setShowPlayerSelectModal(false)}
        />
      )}
    </>
  );
}
