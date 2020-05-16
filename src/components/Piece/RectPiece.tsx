import React from 'react';
import {
  Text,
  Image,
  Label,
  Tag,
  Circle,
  Transformer,
  Rect,
} from 'react-konva';

import { useAsset } from './utils';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';
import {
  BoardItem,
  CardItem,
  ImageTokenItem,
  RectTokenItem,
} from '../../types';

interface Props {
  onSelect?: () => void;
  onChange: (o: any) => void;
  isSelected?: boolean;
  item: RectTokenItem;
}

export function RectPiece(props: Props) {
  const { isSelected, item, onSelect, onChange } = props;
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer(objectRef, onChange);

  return (
    <>
      <Rect
        id={item.id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        fill={item.color}
        onClick={onSelect}
        onTap={onSelect}
        ref={objectRef}
        draggable
        onDragMove={handleTransform}
        onTransform={handleTransform}
      />
      <PieceTransformer
        isSelected={isSelected || false}
        objectRef={objectRef}
      />
    </>
  );
}
