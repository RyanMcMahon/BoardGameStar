import _ from 'lodash';
import React from 'react';

import { Game, PublicGame } from '../../types';
import { deleteGame } from '../../utils/store';
import { Button } from '../../utils/style';
import styled from 'styled-components';
import { PublishModal } from '../PublishModal';
import { DropdownButton } from '../DropdownButton';

interface Props {
  disabled: boolean;
  name: string;
  config: Game;
  onGameSelect: (config: Game) => void;
  onEditGame: (config: Game) => void;
  onReloadConfigs: () => void;
}

const GameImage = styled.img({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
});

const GameHeader = styled.h3({
  margin: '2rem 0 .5rem',
});

const GameSummary = styled.div({
  height: '80px',
  overflow: 'hidden',
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
  const { config: game, disabled, name, onReloadConfigs } = props;
  const [showPublishModal, setShowPublishModal] = React.useState(false);
  const scenarioRef = React.createRef<HTMLSelectElement>();
  const myGames = ((window.localStorage.getItem('my_games') as any) || '')
    .split(',')
    .filter((x: string) => x);

  const dropdownItems = [
    {
      label: 'Edit',
      fn: () => props.onEditGame(game),
    },
  ];

  if (myGames.includes(game.id)) {
    dropdownItems.push({
      label: 'Publish',
      fn: () => setShowPublishModal(true),
    });
  }

  dropdownItems.push({
    label: 'Delete',
    fn: () => {
      deleteGame(game.id);
      onReloadConfigs();
    },
  });

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
    <div>
      <GameImage
        src={game.thumbnail ? game.thumbnail : 'board_game_star.png'}
      />
      <GameHeader>{name}</GameHeader>
      Version {game.version}.0
      <br />
      {_.size(game.config.scenarios) > 1 && (
        <Select defaultValue={game.config.curScenario} ref={scenarioRef}>
          {Object.values(game.config.scenarios).map(scenario => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </Select>
      )}
      <DropdownButton items={dropdownItems} disabled={disabled}>
        <Button design="primary" onClick={handleGameSelect} disabled={disabled}>
          Play
        </Button>
      </DropdownButton>
      <GameSummary>{game.summary}</GameSummary>
      {/* 
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
      )} */}
      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          config={game}
        />
      )}
    </div>
  );
}
