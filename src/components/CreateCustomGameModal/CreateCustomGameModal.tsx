import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';

interface Props {
  onClose: () => void;
}

const Wrapper = styled.div({
  padding: '2rem',
  margin: '2rem 0',
  height: '600px',
  width: '500px',
  overflowY: 'scroll',
});

const Code = styled.pre({
  background: '#eaeaea',
});

export function CreateCustomGameModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Wrapper>
        <ol>
          <li>
            Create a new folder 'games/[Game Name]' relative to this file.
          </li>
          <li>
            Create a 'config.js' file in the new folder using the template
            below.
          </li>
          <li>Create an 'images' subfolder inside of the folder.</li>
          <li>Add all relevant assets to the images folder.</li>
          <li>Modify the 'config.js' file for your game.</li>
          <li>Restart the app.</li>
        </ol>
        <Code>
          {`// Sample config.js
module.exports = {
  players: [
    {
      color: '#e74c3c',
      x: 0,
      y: 500,
    },
  ],
  board: [
    {
      id: 'piece1',
      type: 'piece',
      fill: '#111',
      x: 620,
      y: 20,
      delta: 0,
      width: 30,
      height: 10
    },
    {
      type: 'board',
      image: 'board.png',
      x: 0,
      y: 0,
      delta: 0,
      width: 600,
      height: 800
    }
  ],
  decks: [
    {
      name: 'Draw',
      id: 'deck',
      image: 'deck.png',
      x: 620,
      y: 400,
      width: 200,
      height: 300,
      cards: [
        {
          image: 'card1.png',
          count: 10
        },
      ]
    }
  ]
}`}
        </Code>
      </Wrapper>
    </Modal>
  );
}
