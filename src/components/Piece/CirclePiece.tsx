import React from 'react';
import { Text, Image, Label, Tag, Circle, Transformer } from 'react-konva';

import { useAsset } from './utils';
import { Assets } from '../../utils/game';
import { PieceTransformer, useTransformer } from './PieceTransformer';
import {
  BoardItem,
  CardItem,
  ImageTokenItem,
  CircleTokenItem,
} from '../../types';

interface Props {
  onSelect: () => void;
  onChange: (o: any) => void;
  isSelected: boolean;
  item: CircleTokenItem;
}

export function CirclePiece(props: Props) {
  const { isSelected, item, onSelect, onChange } = props;
  const objectRef = React.useRef<any>();
  const trRef = React.createRef<any>();

  const handleTransform = () => {
    const node = objectRef.current;
    const rotation = node.rotation();
    const scaleX = node.scaleX();
    // const scaleY = node.scaleY();

    // Reset Scale
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      rotation,
      x: node.x(),
      y: node.y(),
      radius: (node.width() * scaleX) / 2,
    });
  };

  React.useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.setNode(objectRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Circle
        id={item.id}
        radius={item.radius}
        fill={item.color}
        x={item.x}
        y={item.y}
        onClick={onSelect}
        onTap={onSelect}
        ref={objectRef}
        draggable
        onDragEnd={handleTransform}
        onTransformEnd={handleTransform}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          borderStrokeWidth={2}
          rotateEnabled={false}
          onTransform={e => {
            // debugger
            const node = objectRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            if (scaleX !== 1) {
              node.scaleY(scaleX);
            }
            if (scaleY !== 1) {
              node.scaleX(scaleY);
            }
          }}
          boundBoxFunc={(oldBox: any, newBox: any) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
