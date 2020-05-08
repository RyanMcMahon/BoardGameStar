import React, { MutableRefObject } from 'react';
// import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import styled from 'styled-components';

import { RenderItem, ContextMenuItem } from '../../types';
import { BoardItem } from '../BoardItem';

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

interface Props {
  onMoveItem: (id: string, x: number, y: number) => void;
  onDeckPrompt: (id: string) => void;
  onRename: (name: string) => void;
  onPickUpCard: (id: string) => void;
  onShuffleDiscarded?: (id: string) => void;
  onDiscardPlayed?: (id: string) => void;
  assets: { [key: string]: string };
  board: RenderItem[];
  container: MutableRefObject<HTMLDivElement | undefined>;
  handCounts: { [key: string]: number };
}

const ZOOM_RATE = 1.02;

export function Board(props: Props) {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>({ x: 0, y: 0, items: [] });
  const updateDimensions = React.useCallback(() => {
    if (props.container && props.container.current) {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, [props.container]);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  React.useLayoutEffect(updateDimensions, [
    props.container,
    props.container.current,
  ]);

  React.useLayoutEffect(() => {
    // TODO make sure context menu is visible
  }, [contextMenu]);

  // const handleDragStart = (e: any) => {
  //   e.target.setAttrs({
  //     scaleX: 1.05,
  //     scaleY: 1.05,
  //     opacity: 0.8,
  //   });
  // };

  // const handleDragEnd = (id: string) => (e: any) => {
  //   e.target.to({
  //     duration: 0.08,
  //     easing: Konva.Easings.EaseIn,
  //     scaleX: 1,
  //     scaleY: 1,
  //     opacity: 1,
  //   });
  //   props.onMoveItem(id, 1, 1); // TODO
  // };

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

  const closeContextMenu = () => setContextMenu(null);

  const handleContextMenu = (
    x: number,
    y: number,
    items: ContextMenuItem[]
  ) => {
    console.log('context', x, y);
    setContextMenu({
      x,
      y,
      items,
    });
  };

  return (
    <>
      {contextMenu && contextMenu.items.length > 0 && (
        <ContextMenu
          style={{
            left: contextMenu.x,
            top: contextMenu.y - 10, // TODO why is this off by 10?
          }}
        >
          {contextMenu.items.map(item => (
            <ContextMenuOption
              onClick={() => {
                closeContextMenu();
                item.fn();
              }}
            >
              {item.label}
            </ContextMenuOption>
          ))}
          <ContextMenuOption onClick={closeContextMenu}>
            Cancel
          </ContextMenuOption>
        </ContextMenu>
      )}
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onWheel={handleOnWheel}
      >
        <Layer>
          {props.board
            .filter(x => x.type === 'board')
            .map(item => (
              <BoardItem
                assets={props.assets}
                key={item.id}
                item={item}
                onMove={() => {}}
                handCounts={props.handCounts}
              />
            ))}
        </Layer>
        <Layer>
          {props.board
            .filter(x => x.type !== 'board')
            .map(item => (
              <BoardItem
                assets={props.assets}
                key={item.id}
                item={item}
                onDeckPrompt={props.onDeckPrompt}
                onRename={props.onRename}
                onMove={props.onMoveItem}
                onPickUpCard={props.onPickUpCard}
                handCounts={props.handCounts}
                onContextMenu={handleContextMenu}
                onShuffleDiscarded={props.onShuffleDiscarded}
                onDiscardPlayed={props.onDiscardPlayed}
              />
            ))}
        </Layer>
      </Stage>
    </>
  );
}
