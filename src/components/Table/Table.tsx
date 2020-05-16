import React, { MutableRefObject } from 'react';
// import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import styled from 'styled-components';

import { RenderItem, ContextMenuItem } from '../../types';

interface Props {
  children: React.ReactNode;
  // onMoveItem: (id: string, x: number, y: number) => void;
  // onDeckPrompt: (id: string) => void;
  // onRename: (name: string) => void;
  // onPickUpCard: (id: string) => void;
  // onShuffleDiscarded?: (id: string) => void;
  // onDiscardPlayed?: (id: string) => void;
  // assets: { [key: string]: string };
  // board: RenderItem[];
  // handCounts: { [key: string]: number };
  // containerRef: MutableRefObject<HTMLDivElement | null>;
}

interface WrapperProps {
  children: React.ReactNode;
}

const ContextMenu = styled.ul({
  padding: '10px',
  listStyle: 'none',
  background: '#fff',
  position: 'absolute',
  zIndex: 1000,
  border: '1px solid #333',
});

const ContextMenuOption = styled.li({
  padding: '5px',
  ':hover': {
    cursor: 'pointer',
    color: '#08c',
  },
});

const ZOOM_RATE = 1.02;

const TableContainer = styled.div({
  flex: 1,
  '> div': {
    width: '100%',
    height: '100%',
  },
});

// export function Table(props: WrapperProps) {
//   const containerRef = React.createRef<HTMLDivElement>();

//   return (
//     <TableContainer>
//       <TableStage containerRef={containerRef}>{props.children}</TableStage>
//     </TableContainer>
//   );
// }

export function Table(props: Props) {
  // const { containerRef } = props;
  const [dimensions, setDimensions] = React.useState({
    width: 500,
    height: 500,
  });
  // const [contextMenu, setContextMenu] = React.useState<{
  //   x: number;
  //   y: number;
  //   items: ContextMenuItem[];
  // } | null>({ x: 0, y: 0, items: [] });
  const updateDimensions = React.useCallback(() => {
    // console.log('check update dimensions');
    // if (containerRef && containerRef.current) {
    // console.log('update dimensions', window.innerWidth, window.innerHeight);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    // }
  }, []);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // React.useLayoutEffect(updateDimensions, [containerRef, containerRef.current]);
  React.useLayoutEffect(updateDimensions, []);

  const handleOnWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.currentTarget;
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale =
      e.evt.deltaY > 0 ? oldScale / ZOOM_RATE : oldScale * ZOOM_RATE;
    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
  };

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      draggable
      onWheel={handleOnWheel}
    >
      {props.children}
    </Stage>
  );
}
