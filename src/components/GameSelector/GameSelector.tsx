import React from 'react';

import { Config, GameConfig } from '../../types';
import { ScenarioSelector } from '../ScenarioSelector';
import { Button } from '../../utils/style';
import styled from 'styled-components';

interface Props {
  gameName: string;
  config: Config;
  onGameSelect: (config: GameConfig) => void;
}

const GameHeader = styled.h3({
  margin: '2rem 0 .5rem',
});

export function GameSelector(props: Props) {
  const { config, gameName } = props;

  return (
    <>
      <GameHeader>{gameName}</GameHeader>
      {Array.isArray(config) ? (
        <ScenarioSelector
          scenarios={config}
          onScenarioSelect={props.onGameSelect}
        />
      ) : (
        <Button design="primary" onClick={() => props.onGameSelect(config)}>
          Play
        </Button>
      )}
    </>
  );
}
