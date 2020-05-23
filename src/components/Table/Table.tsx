import React from 'react';
import { Stage } from 'react-konva';

interface Props {
  children: React.ReactNode;
}

const ZOOM_RATE = 1.02;

export const Table = React.forwardRef((props: Props, ref: any) => {
  const stageRef = React.createRef<Stage>();
  const [dimensions, setDimensions] = React.useState({
    width: 200,
    height: 200,
  });
  const updateDimensions = React.useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

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

  const handleZoom = (scale: number) => () => {
    const stage: any = stageRef.current;
    if (stage) {
      const oldScale = stage.scaleX();
      stage.scale({ x: oldScale * scale, y: oldScale * scale });
      stage.batchDraw();
    }
  };

  if (ref) {
    ref.current = {
      zoomIn: handleZoom(1.1),
      zoomOut: handleZoom(0.9),
    };
  }

  return (
    <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      draggable
      onWheel={handleOnWheel}
    >
      {props.children}
    </Stage>
  );
});
