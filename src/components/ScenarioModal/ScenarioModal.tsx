import React from 'react';
import styled from 'styled-components';

import { Button } from '../../utils/style';
import { Modal } from '../Modal';
import { ScenarioOption } from '../../types';

interface Props {
  onSave: (name: string) => void;
  onClose: () => void;
  scenario: ScenarioOption;
}

export function ScenarioModal(props: Props) {
  const inputRef = React.createRef<HTMLInputElement>();
  const handleSubmit = () => {
    if (inputRef.current) {
      props.onSave(inputRef.current.value);
    }
  };

  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <Modal.Title>Scenario Name</Modal.Title>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            defaultValue={props.scenario.name}
            ref={inputRef}
            placeholder="Name"
          />
          <br />
          <Button design="success" onClick={handleSubmit}>
            Save
          </Button>
        </form>
      </Modal.Content>
    </Modal>
  );
}
