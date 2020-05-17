import React from 'react';
import { Transformer } from 'react-konva';

interface Props {
  isSelected: boolean;
  objectRef: React.MutableRefObject<any>;
}

interface ObjectUpdate {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function useTransformer(
  objectRef: React.MutableRefObject<any>,
  fn: (o: ObjectUpdate) => void
) {
  return () => {
    const node = objectRef.current;
    const rotation = node.rotation();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset Scale
    node.scaleX(1);
    node.scaleY(1);

    fn({
      rotation,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };
}

export function PieceTransformer(props: Props) {
  const trRef = React.createRef<any>();
  const { isSelected, objectRef } = props;

  React.useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.setNode(objectRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, trRef, objectRef]);

  if (!isSelected) {
    return null;
  }

  return (
    <Transformer
      ref={trRef}
      borderStrokeWidth={2}
      boundBoxFunc={(oldBox: any, newBox: any) => {
        // limit resize
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
}
