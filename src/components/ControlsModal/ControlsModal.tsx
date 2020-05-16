import React from 'react';
import styled from 'styled-components';

import { Modal } from '../Modal';

interface Props {
  onClose: () => void;
}

const ControlHeader = styled.h3({
  margin: '1rem 0 0',
  fontSize: '18px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
});

// const Key = styled.div({
//   padding: '1rem',
//   borderTop: '2px solid #ccc',
//   borderLeft: '4px solid #ccc',
//   borderRight: '4px solid #ccc',
//   borderBottom: '8px solid #ccc',
//   borderRadius: '6px',
// });

export function ControlsModal(props: Props) {
  return (
    <Modal onClose={props.onClose}>
      <Modal.Content>
        <ControlHeader>Board Controls</ControlHeader>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Command</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Move Viewport</td>
              <td>Drag</td>
            </tr>
            <tr>
              <td>Zoom In / Out</td>
              <td>Scroll</td>
            </tr>
          </tbody>
        </table>

        <ControlHeader>Item Controls</ControlHeader>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Command</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Move Item</td>
              <td>Drag</td>
            </tr>
          </tbody>
        </table>

        <ControlHeader>Deck Controls</ControlHeader>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Command</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Deck Menu</td>
              <td>Right Click</td>
            </tr>
            <tr>
              <td>Draw Cards Into Hand</td>
              <td>Double Click</td>
            </tr>
          </tbody>
        </table>
      </Modal.Content>
    </Modal>
  );
}
