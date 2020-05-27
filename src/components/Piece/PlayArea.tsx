import React from 'react';
import { Text, Label, Tag, Transformer } from 'react-konva';
import { PlayerOption } from '../../types';
import { useTransformer } from './PieceTransformer';

interface Props {
  piece: PlayerOption;
  handCount: number;
  draggable?: boolean;
  isSelected?: boolean;
  onChange: (o: any) => void;
  onSelect?: () => void;
}

export function PlayArea(props: Props) {
  const { piece, handCount, draggable, isSelected, onChange, onSelect } = props;
  const objectRef = React.useRef<any>();
  const handleTransform = useTransformer({
    objectRef,
    fn: onChange || (() => {}),
  });

  const trRef = React.createRef<any>();

  React.useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.setNode(objectRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, trRef]);

  return (
    <>
      <Label
        ref={objectRef}
        x={piece.x}
        y={piece.y}
        draggable={draggable}
        onDragMove={handleTransform}
        onClick={onSelect}
        onTap={onSelect}
      >
        <Tag fill={piece.color} lineJoin="round" />
        <Text
          text={`${piece.name} (${handCount} cards in hand)`}
          fontSize={32}
          padding={5}
          fill="white"
        />
      </Label>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          resizeEnabled={false}
          borderStrokeWidth={2}
        />
      )}
    </>
  );
}
