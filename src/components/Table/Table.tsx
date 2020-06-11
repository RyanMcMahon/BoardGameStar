import _ from 'lodash';
import React from 'react';

import { Viewport } from 'pixi-viewport';
// import Konva from 'konva';
// import { Stage, Layer } from 'react-konva';
import {
  utils,
  Graphics,
  Texture,
  Container,
  Text,
  Application,
  Sprite,
  Rectangle,
  ParticleContainer,
  DisplayObject,
} from 'pixi.js';
import { Stage } from '@inlet/react-pixi';
import { useAppContext } from '../App/AppContext';
import { RenderPiece, Assets } from '../../types';
import { ImagePiece } from '../Piece/ImagePiece';

interface Props {
  isLoaded?: boolean;
  selectedIds?: Set<string>;
  // children: React.ReactNode;
  pieces: RenderPiece[];
  assets: Assets;
  onZoom: () => void;
}

const ZOOM_RATE = 1.02;

// by default Konva prevent some events when node is dragging
// it improve the performance and work well for 95% of cases
// we need to enable all events on Konva, even when we are dragging a node
// so it triggers touchmove correctly
// (Konva as any).hitOnDragEnabled = true;

function getDistance(p1: Touch, p2: Touch) {
  return Math.sqrt(
    Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2)
  );
}

let scaleDist = 0;

class ISprite extends Sprite {
  id?: string;
}

export const Table = React.forwardRef((props: Props, ref: any) => {
  // const [scaleDist, setScaleDist] = React.useState<number>(0);
  const { onZoom, isLoaded, selectedIds, pieces, assets } = props;
  const { state, dispatch } = useAppContext();
  const dragLayerRef = React.createRef<any>();
  const stageRef = React.createRef<Stage>();
  const [container, setContainer] = React.useState<Container>();
  const [zoomInit, setZoomInit] = React.useState(false);
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
    if (!stageRef.current) {
      return;
    }

    const stage = (stageRef.current as any).app.stage as Container;
    if (stage && !container) {
      const container = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1000,
        worldHeight: 1000,
        // interaction: (stageRef.current as any).app.renderer.plugins.interaction,
      });
      // container.x = 0;
      // container.y = 0;
      // container.width = 99999;
      // container.height = 99999;
      // container.interactive = true;
      // container.scale.set(0.4);
      // container.hitArea = new Rectangle(
      //   -999999,
      //   -999999,
      //   999999999999,
      //   999999999999
      // );

      stage.addChild(container);
      container
        .drag()
        .pinch()
        .wheel()
        .decelerate();
      container.on('pinch-start', () =>
        container.children.forEach(child => (child.interactive = false))
      );
      container.on('pinch-end', () =>
        container.children.forEach(child => (child.interactive = false))
      );
      setContainer(container);
    }
  }, [stageRef, container]);

  React.useEffect(() => {
    if (!container) {
      return;
    }

    const renderedPieces = new Set();

    container.children.forEach(child => {
      renderedPieces.add((child as ImagePiece).id);
    });

    pieces
      .filter(p => !renderedPieces.has(p.id))
      .forEach(piece => {
        switch (piece.type) {
          case 'board': {
            const child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
            });
            child.interactive = false;
            container.addChild(child);
            break;
          }

          case 'deck': {
            const child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
              onTransformStart: () => {
                container.interactive = false;
              },
              onTransformEnd: () => {
                container.interactive = true;
              },
            });
            const countPosition = { x: 70, y: 70 };
            const circle = new Graphics();
            child.addChild(circle);
            circle.beginFill(0x000000);
            circle.lineStyle(0);
            circle.drawCircle(countPosition.x, countPosition.y, 60);
            circle.alpha = 0.5;
            circle.endFill();

            const cardCount = new Text(`${piece.count}`, {
              fontSize: '38px',
              fill: 'white',
              align: 'center',
            });
            cardCount.x = countPosition.x;
            cardCount.y = countPosition.y - 25;
            cardCount.anchor.set(0.5);
            child.addChild(cardCount);

            const divider = new Graphics();
            divider.beginFill(0xffffff);
            divider.drawRect(countPosition.x - 35, countPosition.y, 70, 4);
            divider.endFill();
            child.addChild(divider);

            const cardTotal = new Text(`${piece.total}`, {
              fontSize: '38px',
              fill: 'white',
              align: 'center',
            });
            cardTotal.x = countPosition.x;
            cardTotal.y = countPosition.y + 25;
            cardTotal.anchor.set(0.5);
            child.addChild(cardTotal);

            container.addChild(child);
            break;
          }

          case 'card': {
            const child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
              onTransformStart: () => {
                container.interactive = false;
              },
              onTransformEnd: () => {
                container.interactive = true;
              },
            });
            container.addChild(child);
            break;
          }

          case 'image': {
            const child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
              onTransformStart: () => {
                container.interactive = false;
              },
              onTransformEnd: () => {
                container.interactive = true;
              },
            });
            child.scale.copyFrom(container.scale);
            console.log('container', container.scale);
            container.addChild(child);
            break;
          }

          case 'rect': {
            const child = new ImagePiece({
              ...piece,
              texture: Texture.WHITE,
              onTransformStart: () => {
                container.interactive = false;
              },
              onTransformEnd: () => {
                container.interactive = true;
              },
            });

            child.sprite.tint = utils.string2hex(piece.color);
            container.addChild(child);
            break;
          }

          case 'circle': {
            const child = new ImagePiece({
              ...piece,
              width: piece.radius,
              height: piece.radius,
              texture: Texture.EMPTY,
              onTransformStart: () => {
                container.interactive = false;
              },
              onTransformEnd: () => {
                container.interactive = true;
              },
            });
            const circle = new Graphics();
            child.addChild(circle);
            child.scale.copyFrom(container.scale);
            circle.beginFill(utils.string2hex(piece.color));
            circle.lineStyle(0);
            circle.drawCircle(0, 0, piece.radius);
            circle.endFill();

            // child.mask = p;
            container.addChild(child);
            break;
          }
        }
      });
  }, [container, pieces]);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // React.useEffect(() => {
  //   Array.from(selectedIds || new Set()).forEach(id => {
  //     const node = stageRef.current?.find(`#${id}`)[0];
  //     if (node) {
  //       node.moveTo(dragLayerRef.current);
  //     }
  //     // dragLayerRef.current
  //     stageRef.current?.batchDraw();
  //   });
  // }, [selectedIds, stageRef, dragLayerRef]);

  React.useLayoutEffect(updateDimensions, []);
  // React.useEffect(() => {
  //   const stage = stageRef.current;
  //   if (stage && isLoaded && !zoomInit) {
  //     const [layer] = Array.from(stage.children);
  //     const children = Array.from(layer.children);
  //     const min = { x: 0, y: 0 };
  //     const max = { x: 0, y: 0 };
  //     children.forEach((child: Konva.Node) => {
  //       if (child.attrs.x < min.x) {
  //         min.x = child.attrs.x;
  //       } else if (child.attrs.x + child.attrs.width > max.x) {
  //         max.x = child.attrs.x + child.attrs.width;
  //       }
  //       if (child.attrs.y < min.y) {
  //         min.y = child.attrs.y;
  //       } else if (child.attrs.y + child.attrs.height > max.y) {
  //         max.y = child.attrs.y + child.attrs.height;
  //       }
  //     });

  //     const xScale = (stage.width() / (max.x - min.x)) * 0.8;
  //     const yScale = (stage.height() / (max.y - min.y)) * 0.8;
  //     const newScale = xScale < yScale ? xScale : yScale;
  //     stage.scale({ x: newScale, y: newScale });
  //     stage.offsetX(min.x * 1.2);
  //     stage.offsetY(min.y * 1.2);
  //     stage.batchDraw();
  //     setZoomInit(true);
  //   }
  // }, [isLoaded, stageRef, zoomInit]);

  // const handleOnWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  //   e.evt.preventDefault();
  //   const stage = e.currentTarget as Konva.Stage;
  //   const oldScale = stage.scaleX();

  //   const newScale =
  //     e.evt.deltaY > 0 ? oldScale / ZOOM_RATE : oldScale * ZOOM_RATE;
  //   stage.scale({ x: newScale, y: newScale });

  //   // Center relative to pointer
  //   const zoomCenter = stage.getPointerPosition();
  //   if (zoomCenter) {
  //     centerStage(zoomCenter, oldScale, newScale);
  //   }

  //   stage.batchDraw();
  //   onZoom();
  // };

  // const handleZoom = (scale: number) => () => {
  //   const stage = stageRef.current;
  //   if (stage) {
  //     const oldScale = stage.scaleX();
  //     stage.scale({ x: oldScale * scale, y: oldScale * scale });
  //     stage.batchDraw();
  //     onZoom();
  //   }
  // };

  // const centerStage = (
  //   zoomCenter: { x: number; y: number },
  //   oldScale: number,
  //   newScale: number
  // ) => {
  //   const stage = stageRef.current;
  //   if (!stage) {
  //     return;
  //   }

  //   const newCenter = {
  //     x: zoomCenter.x / oldScale - stage.x() / oldScale,
  //     y: zoomCenter.y / oldScale - stage.y() / oldScale,
  //   };

  //   const newPos = {
  //     x: -(newCenter.x - zoomCenter.x / newScale) * newScale,
  //     y: -(newCenter.y - zoomCenter.y / newScale) * newScale,
  //   };

  //   stage.position(newPos);
  // };

  // if (ref) {
  //   ref.current = {
  //     zoomIn: handleZoom(1.1),
  //     zoomOut: handleZoom(0.9),
  //     redraw: () => stageRef.current && stageRef.current.batchDraw(),
  //     getNode: (id: string) =>
  //       stageRef.current && stageRef.current.find(`#${id}`)[0],
  //     updateSelectedIds: (ids: string) => {},
  //   };
  // }

  // return (
  //   <Stage
  //     ref={stageRef as any}
  //     width={dimensions.width}
  //     height={dimensions.height}
  //     draggable={state.globalDragEnabled}
  //     onWheel={handleOnWheel}
  //     onTouchMove={e => {
  //       e.evt.preventDefault();

  //       const touch1 = e.evt.touches[0];
  //       const touch2 = e.evt.touches[1];
  //       const stage = e.currentTarget as Konva.Stage;

  //       if (!stage) {
  //         return;
  //       }

  //       if (touch1 && touch2) {
  //         const dist = getDistance(touch1, touch2);
  //         const lastScaleDist = scaleDist || dist;
  //         const oldScale = stage.scaleX();
  //         const newScale = (stage.scaleX() * dist) / lastScaleDist;
  //         stage.scale({ x: newScale, y: newScale });

  //         // Center Absolutely
  //         const zoomCenter = {
  //           x: (stage.offsetX() + stage.width()) / 2,
  //           y: (stage.offsetY() + stage.height()) / 2,
  //         };
  //         centerStage(zoomCenter, oldScale, newScale);

  //         stage.batchDraw();
  //         scaleDist = dist;
  //         onZoom();

  //         if (state.globalDragEnabled) {
  //           dispatch({ type: 'disable_drag' });
  //         }
  //       }
  //     }}
  //     onTouchEnd={() => {
  //       scaleDist = 0;
  //       if (!state.globalDragEnabled) {
  //         dispatch({ type: 'enable_drag' });
  //       }
  //     }}
  //   >
  //     {props.children}
  //     <Layer ref={dragLayerRef} />
  //   </Stage>
  // );

  return (
    <Stage
      ref={stageRef}
      options={{ transparent: true }}
      width={dimensions.width}
      height={dimensions.height}
    />
  );
});
