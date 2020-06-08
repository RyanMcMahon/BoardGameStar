import React from 'react';
import Konva from 'konva';
import { Stage } from 'react-konva';
import { useAppContext } from '../App/AppContext';

interface Props {
  children: React.ReactNode;
  onZoom: () => void;
}

const ZOOM_RATE = 1.02;

// by default Konva prevent some events when node is dragging
// it improve the performance and work well for 95% of cases
// we need to enable all events on Konva, even when we are dragging a node
// so it triggers touchmove correctly
(Konva as any).hitOnDragEnabled = true;

function getDistance(p1: Touch, p2: Touch) {
  return Math.sqrt(
    Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2)
  );
}

let scaleDist = 0;

export const Table = React.forwardRef((props: Props, ref: any) => {
  // const [scaleDist, setScaleDist] = React.useState<number>(0);
  const { onZoom } = props;
  const { state, dispatch } = useAppContext();
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

    const newScale =
      e.evt.deltaY > 0 ? oldScale / ZOOM_RATE : oldScale * ZOOM_RATE;
    stage.scale({ x: newScale, y: newScale });

    // Center relative to pointer
    const zoomCenter = stage.getPointerPosition();
    centerStage(zoomCenter, oldScale, newScale);

    stage.batchDraw();
    onZoom();
  };

  const handleZoom = (scale: number) => () => {
    const stage: any = stageRef.current;
    if (stage) {
      const oldScale = stage.scaleX();
      stage.scale({ x: oldScale * scale, y: oldScale * scale });
      stage.batchDraw();
      onZoom();
    }
  };

  const centerStage = (
    zoomCenter: { x: number; y: number },
    oldScale: number,
    newScale: number
  ) => {
    const stage = stageRef.current as any;
    const newCenter = {
      x: zoomCenter.x / oldScale - stage.x() / oldScale,
      y: zoomCenter.y / oldScale - stage.y() / oldScale,
    };

    const newPos = {
      x: -(newCenter.x - zoomCenter.x / newScale) * newScale,
      y: -(newCenter.y - zoomCenter.y / newScale) * newScale,
    };

    stage.position(newPos);
  };

  if (ref) {
    ref.current = {
      zoomIn: handleZoom(1.1),
      zoomOut: handleZoom(0.9),
      redraw: () => (stageRef.current as any).batchDraw(),
      getNode: (id: string) => (stageRef.current as any).find(`#${id}`)[0],
    };
  }

  return (
    <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
      draggable={state.globalDragEnabled}
      onWheel={handleOnWheel}
      onTouchMove={e => {
        e.evt.preventDefault();

        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];
        const stage = e.currentTarget as any;

        if (!stage) {
          return;
        }

        if (touch1 && touch2) {
          const dist = getDistance(touch1, touch2);
          const lastScaleDist = scaleDist || dist;
          const oldScale = stage.scaleX();
          const newScale = (stage.scaleX() * dist) / lastScaleDist;
          stage.scale({ x: newScale, y: newScale });

          // Center Absolutely
          const zoomCenter = {
            x: (stage.offsetX() + stage.width()) / 2,
            y: (stage.offsetY() + stage.height()) / 2,
          };
          centerStage(zoomCenter, oldScale, newScale);

          (stage as any).batchDraw();
          scaleDist = dist;
          onZoom();

          if (state.globalDragEnabled) {
            dispatch({ type: 'disable_drag' });
          }
        }
      }}
      onTouchEnd={() => {
        scaleDist = 0;
        if (!state.globalDragEnabled) {
          dispatch({ type: 'enable_drag' });
        }
      }}
    >
      {props.children}
    </Stage>
  );
});
