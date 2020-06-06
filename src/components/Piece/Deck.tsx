import React from 'react';
import { Text, Image, Label, Tag, Group } from 'react-konva';

import { useAsset } from './utils';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';
import { DeckPiece } from '../../types';

interface Props {
  assets: Assets;
  piece: DeckPiece;
  editingEnabled?: boolean;
  draggable?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange: (o: any) => void;
  onDblClick: () => void;
  onContextMenu?: (e: any) => void;
}

export function Deck(props: Props) {
  const {
    piece,
    onSelect,
    assets,
    draggable,
    isSelected,
    editingEnabled,
    onChange,
    onDblClick,
    onContextMenu,
  } = props;
  const [isHolding, setIsHolding] = React.useState(false);
  const [checkForHolding, setCheckForHolding] = React.useState(false);
  const image = useAsset(assets, piece);
  const objectRef = React.useRef<any>();
  const groupRef = React.useRef<any>();
  const handleTransform = useTransformer({
    groupRef,
    objectRef,
    fn: onChange,
  });

  if (isHolding && checkForHolding && onContextMenu) {
    onContextMenu({
      evt: {
        clientX: 20,
        clientY: 20,
      },
    });
    setCheckForHolding(false);
  }

  return (
    <Group
      id={piece.id}
      x={piece.x}
      y={piece.y}
      draggable={draggable}
      onDragMove={handleTransform}
      ref={groupRef}
    >
      {true && (
        <Label x={0} y={-40}>
          <Tag fill="#111" lineJoin="round" />
          <Text
            text={`${piece.count || 0} of ${piece.total || 0} cards remaining`}
            fontSize={22}
            padding={5}
            fill="white"
          />
        </Label>
      )}

      <Image
        ref={objectRef}
        x={0}
        y={0}
        image={image}
        width={piece.width}
        height={piece.height}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
        onTransform={handleTransform}
        onTouchStart={() => {
          setCheckForHolding(false);
          setIsHolding(true);
          setTimeout(() => setCheckForHolding(true), 700);
        }}
        onTouchEnd={() => {
          setIsHolding(false);
        }}
        onContextMenu={e => {
          e.evt.preventDefault();

          if (onContextMenu) {
            onContextMenu(e);
          }
        }}
      />
      <PieceTransformer
        isSelected={isSelected || false}
        rotateEnabled={false}
        resizeEnabled={editingEnabled || false}
        objectRef={objectRef}
      />
    </Group>
  );
}
