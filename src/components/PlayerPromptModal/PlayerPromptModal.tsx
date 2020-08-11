import _ from 'lodash';
import React from 'react';
import Select from 'react-select';

import { Button, successColor } from '../../utils/style';
import { Modal } from '../Modal';
import {
  Game,
  GamePrompt,
  PromptPlayersEvent,
  PlayerPiece,
  GamePromptAnswer,
  PromptResultsEvent,
  Pieces,
  Card,
  GamePromptSubmission,
} from '../../types';
import {
  FaCheckCircle,
  FaQuestionCircle,
  FaLock,
  FaLockOpen,
} from 'react-icons/fa';
import { Assets } from '../../utils/game';
import styled from 'styled-components';

interface Props {
  playerId: string;
  assets: Assets;
  pieces: Pieces;
  hand: string[];
  event: PromptPlayersEvent;
  players: PlayerPiece[];
  results?: PromptResultsEvent;
  onClose: () => void;
  onSubmitAnswers: (answers?: GamePromptAnswer[]) => void;
}

const PlayerStatus = styled.div({
  fontSize: '20px',
  marginBottom: '0.5rem',
});

const PendingPlayerIcon = styled(FaQuestionCircle)({
  display: 'inline-block',
  marginRight: '1rem',
  position: 'relative',
  top: '3px',
  color: '#aaa',
});

const LockedPlayerIcon = styled(FaCheckCircle)({
  display: 'inline-block',
  marginRight: '1rem',
  position: 'relative',
  top: '3px',
  color: successColor,
});

const ImageAnswer = styled.div({
  marginTop: '1rem',
  textAlign: 'center',
  img: {
    maxWidth: '160px',
    margin: '.5rem 0',
    cursor: 'pointer',
  },
});

const ResultsImage = styled.img({
  maxWidth: '160px',
});

const HandPrompt = styled.div({
  position: 'fixed',
  display: 'flex',
  flexDirection: 'column',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  padding: '0.5rem',
  overflowY: 'scroll',
  zIndex: 9999,
  img: {
    maxWidth: '200px',
    margin: '0.5rem 0.5rem',
    cursor: 'pointer',
    display: 'inline-block',
  },
});

const HandWrapper = styled.div({
  textAlign: 'center',
  marginBottom: '1rem',
  flex: 1,
});

const HandPromptControls = styled.div({
  textAlign: 'right',
  '> *:nth-child(1)': {
    marginRight: '1rem',
  },
});

const SubmissionControls = styled.div({
  marginTop: '1rem',
  '> *:nth-child(1)': {
    marginRight: '1rem',
  },
});

export function PlayerPromptModal(props: Props) {
  const {
    onClose,
    onSubmitAnswers,
    event,
    playerId,
    players,
    results,
    assets,
    pieces,
    hand,
  } = props;
  const playersById = _.keyBy(players, 'playerId');
  const { prompt } = event;

  const [isLocked, setIsLocked] = React.useState(false);
  const [answers, setAnswers] = React.useState<GamePromptAnswer[]>(
    new Array(event.prompt.inputs.length)
  );
  const [handPromptIndex, setHandPrmoptIndex] = React.useState<number | null>(
    null
  );

  const resultsAvailable =
    results &&
    event.players.every(
      id => results.results[id] && typeof results.results[id] !== 'boolean'
    );

  const fillable = !resultsAvailable && event.players.includes(playerId);

  const resetAnswers = () => {
    if (isLocked) {
      onSubmitAnswers();
      setIsLocked(false);
    }
  };

  return (
    <>
      <Modal onClose={() => {}} hideCloseButton={true}>
        <Modal.Content>
          <Modal.Title>{prompt.title}</Modal.Title>

          {resultsAvailable && (
            <>
              <table>
                <thead>
                  <tr>
                    <th></th>

                    {event.players.map(id => (
                      <th key={id}>{playersById[id].name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {event.prompt.inputs.map((input, index) => (
                    <tr key={index}>
                      <td>{input.label}</td>
                      {event.players.map(id => {
                        const playerResults = results!.results[
                          id
                        ] as GamePromptAnswer[];
                        return (
                          <td key={id}>
                            {input.type === 'hand' ? (
                              <>
                                {playerResults[index] ? (
                                  <ResultsImage
                                    alt="img"
                                    src={
                                      assets[
                                        (
                                          pieces[playerResults[index] || ''] ||
                                          {}
                                        ).image
                                      ]
                                    }
                                  />
                                ) : (
                                  '-'
                                )}
                              </>
                            ) : (
                              playerResults[index] || '-'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <Button
                design="success"
                onClick={() => {
                  onClose();
                }}
              >
                Done
              </Button>
            </>
          )}

          {fillable && (
            <>
              {event.players.map(id => {
                const player = playersById[id];
                if (!player) {
                  return null;
                }
                return (
                  <PlayerStatus key={id}>
                    {results && results.results[id] ? (
                      <LockedPlayerIcon />
                    ) : (
                      <PendingPlayerIcon />
                    )}
                    {player.name}
                  </PlayerStatus>
                );
              })}

              {prompt.inputs.map((input, index) => {
                switch (input.type) {
                  case 'text':
                  case 'number':
                    return (
                      <label key={index}>
                        {input.label} <br />
                        <input
                          className="u-full-width"
                          type={input.type}
                          defaultValue={input.type === 'text' ? '' : 0}
                          onChange={e => {
                            const value = e.currentTarget.value;
                            setAnswers(a => [
                              ...a.slice(0, index),
                              value,
                              ...a.slice(index + 1),
                            ]);
                            resetAnswers();
                          }}
                        />
                      </label>
                    );
                  case 'hand':
                    return (
                      <ImageAnswer key={index}>
                        {answers[index] ? (
                          <>
                            <label>{input.label}</label>
                            <img
                              alt="img"
                              src={
                                assets[pieces[answers[index] || ''].image || '']
                              }
                              onClick={() => setHandPrmoptIndex(index)}
                            />
                          </>
                        ) : (
                          <Button
                            block={true}
                            design="primary"
                            disabled={!hand.length}
                            onClick={() => setHandPrmoptIndex(index)}
                          >
                            {input.label}
                          </Button>
                        )}
                      </ImageAnswer>
                    );
                }
              })}

              <SubmissionControls>
                <Button
                  design="success"
                  onClick={() => {
                    onSubmitAnswers(answers);
                    setIsLocked(true);
                  }}
                >
                  {isLocked ? <FaLock /> : <FaLockOpen />}&nbsp; Lock Answers
                </Button>

                <Button
                  design="danger"
                  onClick={() => {
                    onSubmitAnswers(new Array(event.prompt.inputs.length));
                    onClose();
                  }}
                >
                  Decline
                </Button>
              </SubmissionControls>
            </>
          )}
        </Modal.Content>
      </Modal>

      {handPromptIndex !== null && (
        <HandPrompt>
          <HandWrapper>
            {hand.map(id => {
              const piece = pieces[id] as Card;
              if (!piece) {
                return null;
              }

              return (
                <img
                  key={id}
                  alt="img"
                  src={assets[piece.image || '']}
                  onClick={() => {
                    setAnswers(a => [
                      ...a.slice(0, handPromptIndex),
                      id,
                      ...a.slice(handPromptIndex + 1),
                    ]);
                    resetAnswers();
                    setHandPrmoptIndex(null);
                  }}
                />
              );
            })}
          </HandWrapper>

          <HandPromptControls>
            <Button
              design="primary"
              onClick={() => {
                setHandPrmoptIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button
              design="danger"
              onClick={() => {
                setAnswers(a => [
                  ...a.slice(0, handPromptIndex),
                  null,
                  ...a.slice(handPromptIndex + 1),
                ]);
                resetAnswers();
                setHandPrmoptIndex(null);
              }}
            >
              Clear
            </Button>
          </HandPromptControls>
        </HandPrompt>
      )}
    </>
  );
}
