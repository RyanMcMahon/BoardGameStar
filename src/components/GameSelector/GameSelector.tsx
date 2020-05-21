import _ from 'lodash';
import React from 'react';

import { GameConfig } from '../../types';
import { Button } from '../../utils/style';
import styled from 'styled-components';

interface Props {
  gameName: string;
  config: GameConfig;
  onGameSelect: (config: GameConfig) => void;
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

export function GameSelector(props: Props) {
  const { config, gameName } = props;
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
      <GameHeader>{gameName}</GameHeader>
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
    </>
  );
}
