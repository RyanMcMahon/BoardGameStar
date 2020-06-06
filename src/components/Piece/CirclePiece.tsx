import React from 'react';
import { Circle } from 'react-konva';

import { CircleTokenPiece } from '../../types';
import { PieceTransformer } from './PieceTransformer';

interface Props {
  onSelect?: () => void;
  onChange: (o: any) => void;
  editingEnabled?: boolean;
  isSelected?: boolean;
  draggable?: boolean;
  piece: CircleTokenPiece;
}

export const CirclePiece = React.memo((props: Props) => {
  const {
    draggable,
    editingEnabled,
    isSelected,
    piece,
    onSelect,
    onChange,
  } = props;
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
  }, [isSelected, trRef]);

  return (
    <>
      <Circle
        id={piece.id}
        radius={piece.radius}
        fill={piece.color}
        x={piece.x}
        y={piece.y}
        onClick={onSelect}
        onTap={onSelect}
        ref={objectRef}
        draggable={draggable}
        onDragMove={handleTransform}
        onTransform={handleTransform}
      />
      <PieceTransformer
        isSelected={isSelected || false}
        rotateEnabled={false}
        resizeEnabled={editingEnabled || false}
        objectRef={objectRef}
        onTransform={() => {
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
      />
    </>
  );
});
