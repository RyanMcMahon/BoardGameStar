import React from 'react';
import { FaTimes } from 'react-icons/fa';

import { Button } from '../../utils/style';
import { ChatEvent, PlayerPiece } from '../../types';
import styled from 'styled-components';

interface Props {
  chat: ChatEvent[];
  onChat: (message: string) => void;
  onClose: () => void;
  onRename: () => void;
  playerId: string;
  players: PlayerPiece[];
}

const ChatContainer = styled.div({
  position: 'fixed',
  left: 0,
  top: 0,
  bottom: 0,
  right: 0,
  zIndex: 5000,
  backgroundColor: '#fff',
  display: 'flex',
  flexDirection: 'column',
  padding: '3rem 0 0 2rem',
});

const CloseButton = styled(FaTimes)({
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  cursor: 'pointer',
});

const ChatMessages = styled.div({
  flex: 1,
  overflowY: 'scroll',
});

const ChatMessage = styled.div({
  // TODO
  padding: '0 2rem',
});

const NewMessageForm = styled.form({
  display: 'flex',
  flexDirection: 'row',
  paddingTop: '2rem',
  paddingRight: '2rem',
});

const NewMessage = styled.input({
  flex: 1,
  marginRight: '1rem',
});

const PlayerName = styled.div<{ color: string; hover?: boolean }>(options => ({
  display: 'inline-block',
  backgroundColor: options.color,
  padding: '.5rem 2rem',
  marginTop: '1rem',
  borderRadius: '50px',
  color: '#fff',
  fontWeight: 'bold',
  cursor: options.hover ? 'pointer' : 'default',
}));

export function Chat(props: Props) {
  const { players, chat, onChat, onClose } = props;
  const [scrollToBottom, setScrollToBottom] = React.useState(true);
  const chatMessagesRef = React.createRef<HTMLDivElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const playersById: { [playerId: string]: PlayerPiece } = players.reduce(
    (byId, player) => ({
      ...byId,
      [player.playerId || '(unknown)']: player,
    }),
    {}
  );

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement | HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (inputRef.current) {
      onChat(inputRef.current.value);
      inputRef.current.value = '';
      setScrollToBottom(true);
    }
  };

  const handleScroll = () => {
    const el = chatMessagesRef.current;
    if (!el) {
      return;
    }
    const atBottom = el.scrollTop + el.clientHeight === el.scrollHeight;
    if (atBottom && !scrollToBottom) {
      setScrollToBottom(true);
    } else if (!atBottom && scrollToBottom) {
      setScrollToBottom(false);
    }
  };

  React.useLayoutEffect(() => {
    if (chatMessagesRef.current && scrollToBottom) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chat.length, chatMessagesRef, scrollToBottom]);

  return (
    <ChatContainer>
      <CloseButton onClick={onClose} />
      <ChatMessages ref={chatMessagesRef} onScroll={handleScroll}>
        {chat.map(({ playerId, message }, index) => (
          <div key={playerId + index}>
            {(index === 0 || chat[index - 1].playerId !== playerId) &&
              (playerId === props.playerId ? (
                <PlayerName
                  color={playersById[playerId].color}
                  hover={true}
                  onClick={props.onRename}
                >
                  {playersById[playerId].name}
                </PlayerName>
              ) : (
                <PlayerName color={playersById[playerId].color}>
                  {playersById[playerId].name}
                </PlayerName>
              ))}
            <ChatMessage>{message}</ChatMessage>
          </div>
        ))}
      </ChatMessages>
      <NewMessageForm onSubmit={handleSubmit}>
        <NewMessage type="text" ref={inputRef} placeholder="Say something..." />
        <Button design="success" onClick={handleSubmit}>
          Send
        </Button>
      </NewMessageForm>
    </ChatContainer>
  );
}
