import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';
import { PlayerPiece, Game, PublicGame } from '../../types';
import { FaCheckCircle, FaClipboard } from 'react-icons/fa';
import { successColor, Button } from '../../utils/style';
import { getDownloadUrl } from '../../utils/api';

interface Props {
  playerId: string;
  players: PlayerPiece[];
  game: Game | null;
  hostId: string;
  gameId: string;
  onRename: (name: string) => void;
  onClose: () => void;
}

const Wrapper = styled.div({
  width: '240px',
});

const InviteLinkWrapper = styled.div({
  display: 'flex',
  flexWrap: 'nowrap',
  input: {
    width: '197px',
    marginRight: '0.5rem',
  },
});

const CopyButton = styled(Button)({
  fontSize: '24px',
  lineHeight: '20px',
  paddingLeft: '.5rem',
  paddingRight: '.5rem',
});

const InviteHeader = styled.h5({
  margin: '1rem 0 0',
});

const PlayerStatus = styled.div({
  fontSize: '20px',
  marginBottom: '0.5rem',
});

const LockedPlayerIcon = styled(FaCheckCircle)({
  display: 'inline-block',
  marginRight: '1rem',
  position: 'relative',
  top: '3px',
  color: successColor,
});

export function InviteModal(props: Props) {
  const { playerId, players, game, hostId, gameId, onClose, onRename } = props;
  const [rulesLink, setRulesLink] = React.useState<string>('');
  const curPlayer = players.find(p => p.playerId === playerId);
  const inviteLinkRef = React.createRef<HTMLInputElement>();
  const spectateLinkRef = React.createRef<HTMLInputElement>();

  React.useEffect(() => {
    if (!game) {
      return;
    }

    if (game.rules === '_rules') {
      (async () => {
        const u = await getDownloadUrl(
          (game as PublicGame).userId,
          game.id,
          '_rules'
        );
        setRulesLink(u);
      })();
    } else if (game.rules) {
      setRulesLink(game.rules);
    }
  }, [game]);

  if (!curPlayer) {
    return null;
  }

  return (
    <Modal onClose={onClose}>
      <Modal.Content>
        <Wrapper>
          <InviteHeader>Name</InviteHeader>
          <input
            type="text"
            className="u-full-width"
            value={curPlayer.name}
            onChange={e => {
              const name = e.currentTarget.value;
              onRename(name);
            }}
          />

          <InviteHeader>Players:</InviteHeader>
          {players
            .filter(p => p.id !== playerId)
            .map(player => {
              return (
                <PlayerStatus key={player.id}>
                  <LockedPlayerIcon />
                  {player.name}
                </PlayerStatus>
              );
            })}

          <InviteHeader>Host ID:</InviteHeader>
          {hostId}
          <InviteHeader>Game ID:</InviteHeader>
          {gameId}

          <InviteHeader>Invite Link:</InviteHeader>
          <InviteLinkWrapper>
            <input
              ref={inviteLinkRef}
              type="text"
              className="u-full-width"
              defaultValue={`${window.location}`}
            />
            <CopyButton
              design="primary"
              onClick={() => {
                if (inviteLinkRef.current) {
                  inviteLinkRef.current.select();
                  document.execCommand('copy');
                }
              }}
            >
              <FaClipboard />
            </CopyButton>
          </InviteLinkWrapper>

          <InviteHeader>Spectate Link:</InviteHeader>
          <InviteLinkWrapper>
            <input
              ref={spectateLinkRef}
              type="text"
              className="u-full-width"
              defaultValue={`${window.location}`.replace(
                /\/play\//,
                '/spectate/'
              )}
            />
            <CopyButton
              design="primary"
              onClick={() => {
                if (spectateLinkRef.current) {
                  spectateLinkRef.current.select();
                  document.execCommand('copy');
                }
              }}
            >
              <FaClipboard />
            </CopyButton>
          </InviteLinkWrapper>

          {!!rulesLink && (
            <div>
              <InviteHeader>Game Rules:</InviteHeader>
              <a
                href={rulesLink}
                target="_blank"
                rel="noopener noreferrer"
                download={`${game?.name} Rules.pdf`}
              >
                Download
              </a>
              <br />
              <br />
            </div>
          )}

          <Button block={true} design="success" onClick={onClose}>
            Play!
          </Button>
        </Wrapper>
      </Modal.Content>
    </Modal>
  );
}
