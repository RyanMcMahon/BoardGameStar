import _ from 'lodash';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import { GameConfig } from '../../types';
import { deleteGame } from '../../utils/store';
import { Button } from '../../utils/style';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

interface Props {
  name: string;
  config: GameConfig;
  onGameSelect: (config: GameConfig) => void;
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

const DeleteButton = styled(Button)({
  marginLeft: '1rem',
});

export function GameSelector(props: Props) {
  const { config, name, onReloadConfigs } = props;
  const scenarioRef = React.createRef<HTMLSelectElement>();

  const handleGameSelect = () => {
    if (scenarioRef && scenarioRef.current) {
      props.onGameSelect({
        ...config,
        curScenario: scenarioRef.current.value,
      });
    } else {
      props.onGameSelect(config);
    }
  };

  return (
    <>
      <GameHeader>{name}</GameHeader>
      <ReactMarkdown source={config.description} />
      {_.size(config.scenarios) > 1 && (
        <Select defaultValue={config.curScenario} ref={scenarioRef}>
          {Object.values(config.scenarios).map(scenario => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </Select>
      )}
      <Button design="primary" onClick={handleGameSelect}>
        Play
      </Button>
      {config.store === 'browser' && (
        <DeleteButton
          design="danger"
          onClick={() => {
            deleteGame(config.id);
            onReloadConfigs();
          }}
        >
          Delete
        </DeleteButton>
      )}
    </>
  );
}
