import React from 'react';

import { GameConfig, ScenarioConfig } from '../../types';
import { Button } from '../../utils/style';
import styled from 'styled-components';

interface Props {
  scenarios: ScenarioConfig[];
  onScenarioSelect: (config: GameConfig) => void;
}

const Select = styled.select({
  margin: '0 1rem 0 0',
  height: '40px',
  position: 'relative',
  top: '1px',
});

export function ScenarioSelector(props: Props) {
  const { scenarios } = props;
  const selectRef = React.createRef<HTMLSelectElement>();
  const handleScenarioSelect = () => {
    if (selectRef.current) {
      props.onScenarioSelect(
        scenarios[parseInt(selectRef.current.value)].config
      );
    }
  };

  return (
    <div>
      <Select ref={selectRef}>
        {scenarios.map((scenario, index) => (
          <option key={index} value={index}>
            {scenario.name}
          </option>
        ))}
      </Select>
      <Button design="primary" onClick={handleScenarioSelect}>
        Play
      </Button>
    </div>
  );
}
