import _ from 'lodash';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import { Game } from '../../types';
import { deleteGame } from '../../utils/store';
import { Button } from '../../utils/style';
import styled from 'styled-components';
import { PublishModal } from '../PublishModal';

interface Props {
  name: string;
  config: Game;
  onGameSelect: (config: Game) => void;
  onEditGame: (config: Game) => void;
  onReloadConfigs: () => void;
}

const GameHeader = styled.h3({
  margin: '2rem 0 .5rem',
});

const Select = styled.select({
  margin: '0 1rem 0 0',
  height: '40px',
  position: 'relative',
  top: '1px',
});

const GameButton = styled(Button)({
  marginLeft: '1rem',
});

export function GameSelector(props: Props) {
  const { config: game, name, onReloadConfigs } = props;
  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const scenarioRef = React.createRef<HTMLSelectElement>();
  console.log(game);

  const handleGameSelect = () => {
    if (scenarioRef && scenarioRef.current) {
      props.onGameSelect({
        ...game,
        config: {
          ...game.config,
          curScenario: scenarioRef.current.value,
        },
      });
    } else {
      props.onGameSelect(game);
    }
  };

  return (
    <>
      <GameHeader>{name}</GameHeader>
      <ReactMarkdown source={game.description} />
      {_.size(game.config.scenarios) > 1 && (
        <Select defaultValue={game.config.curScenario} ref={scenarioRef}>
          {Object.values(game.config.scenarios).map(scenario => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </Select>
      )}
      <Button design="primary" onClick={handleGameSelect}>
        Play
      </Button>
      <Button design="success" onClick={() => setShowPublishModal(true)}>
        Publish
      </Button>
      {['file', 'browser'].includes(game.store) && (
        <GameButton
          design="success"
          onClick={() => {
            // TODO edit
            props.onEditGame(game);
          }}
        >
          Edit
        </GameButton>
      )}
      {game.store === 'browser' && (
        <GameButton
          design="danger"
          onClick={() => {
            deleteGame(game.id);
            onReloadConfigs();
          }}
        >
          Delete
        </GameButton>
      )}

      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          config={game}
        />
      )}
    </>
  );
}
