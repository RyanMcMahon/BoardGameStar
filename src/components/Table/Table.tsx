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
  // isLoaded?: boolean;
  // selectedPieceIds?: Set<string>;
  // children: React.ReactNode;
  handleUpdatePiece: (piece: RenderPiece, throttled: boolean) => void;
  handleSelectPiece: (id: string) => void;
  // pieces: RenderPiece[];
  assets: Assets;
  // onZoom: () => void;
  // config: {
  //   [key: string]: {
  //     selectable?: boolean;
  //     draggable?: boolean;
  //     resizable?: boolean;
  //     rotatable?: boolean;
  //   };
  // };
}

let app = new Application({
  antialias: true, // default: false
  transparent: true, // default: false
});

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

let instance = 1;
let activeId: string;

// export const Table = React.forwardRef((props: Props, ref: any) => {
export const useTable = (props: Props) => {
  // console.log('use table');
  // const [scaleDist, setScaleDist] = React.useState<number>(0);
  // const {
  //   // selectedPieceIds,
  //   // pieces,
  //   // assets,
  //   // config,
  // } = props;
  const [pieces, setPieces] = React.useState<RenderPiece[]>([]);
  // const [assets, setAssets] = React.useState<Assets>({});
  const [config, setConfig] = React.useState<{
    [key: string]: {
      selectable?: boolean;
      draggable?: boolean;
      resizable?: boolean;
      rotatable?: boolean;
    };
  }>({});
  const onUpdatePiece = props.handleUpdatePiece;
  const onSelectPiece = props.handleSelectPiece;
  const assets = props.assets;

  const [selectedPieceIds, setSelectedPieceIds] = React.useState<Set<string>>(
    new Set()
  );

  const { state, dispatch } = useAppContext();
  const dragLayerRef = React.createRef<any>();
  const stageRef = React.createRef<HTMLDivElement>();
  const [stageAttached, setStageAttached] = React.useState(false);
  const [container, setContainer] = React.useState<Container>();
  const [zoomInit, setZoomInit] = React.useState(false);
  // const [dimensions, setDimensions] = React.useState({
  //   width: 200,
  //   height: 200,
  // });

  const updateDimensions = React.useCallback(() => {
    // setDimensions({
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // });
    app.renderer.resize(window.innerWidth, window.innerHeight);
  }, []);

  React.useEffect(() => {
    if (!stageRef.current || stageAttached) {
      return;
    }

    const stage = app.stage as Container;
    const container = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: 5000,
      worldHeight: 5000,
    });
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
    stageRef.current.appendChild(app.view);
    setStageAttached(true);

    setContainer(container);
  }, [stageRef, stageAttached]);

  React.useEffect(() => {
    if (!container) {
      return;
    }
    console.log('render update', container.children.length);

    const piecesById = _.keyBy(pieces, 'id');
    const renderedPieces = new Set();

    container.children.forEach(child => {
      const piece = child as ImagePiece;
      const curPiece = piecesById[piece.id];

      if (!curPiece) {
        container.removeChild(child);
        return;
      }

      renderedPieces.add(piece.id);
      piece.locked = curPiece.locked;
      if (!piece.transforming && !piece.dragging) {
        piece.x = curPiece.x;
        piece.y = curPiece.y;
        piece.sprite.width = curPiece.width;
        piece.sprite.height = curPiece.height;
        piece.angle = curPiece.rotation || 0;
        if (selectedPieceIds?.has(piece.id)) {
          piece.select();
        } else {
          piece.deselect();
        }
      }

      // piece.onUpdate = p => {
      //   activeId = piece.id;
      //   onUpdatePiece({ ...piecesById[piece.id], ...p }, true);
      // };
    });

    pieces
      .filter(p => !renderedPieces.has(p.id))
      .forEach(piece => {
        let child: ImagePiece;

        switch (piece.type) {
          case 'board': {
            child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
            });
            child.interactive = false;
            break;
          }

          case 'deck': {
            child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
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

            break;
          }

          case 'card': {
            child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
            });
            break;
          }

          case 'image': {
            child = new ImagePiece({
              ...piece,
              texture: Texture.from(assets[piece.image]),
            });
            child.scale.copyFrom(container.scale);
            break;
          }

          case 'rect': {
            child = new ImagePiece({
              ...piece,
              texture: Texture.WHITE,
            });

            child.sprite.tint = utils.string2hex(piece.color);
            break;
          }

          case 'circle': {
            child = new ImagePiece({
              ...piece,
              width: piece.radius,
              height: piece.radius,
              texture: Texture.EMPTY,
            });
            const circle = new Graphics();
            child.addChild(circle);
            child.scale.copyFrom(container.scale);
            circle.beginFill(utils.string2hex(piece.color));
            circle.lineStyle(0);
            circle.drawCircle(0, 0, piece.radius);
            circle.endFill();
            break;
          }

          case 'player': {
            child = new ImagePiece({ ...piece, texture: Texture.EMPTY });
            break;
          }

          default:
            return;
        }

        if (child) {
          const pieceConfig = config[piece.type];
          if (_.size(pieceConfig) === 0) {
            child.interactive = false;
          }

          const selectPiece = () => {
            if (!child.nonSelectClick) {
              onSelectPiece(piece.id);
            }
          };

          // setInterval(() => {
          //   child.x += _.random(10, -10);
          //   child.y += _.random(10, -10);
          // }, 50);

          child.id = piece.id;
          child.interactive = true;
          child.on('tap', selectPiece);
          child.on('click', selectPiece);

          child.onUpdate = p => {
            activeId = piece.id;
            onUpdatePiece({ ...piece, ...p }, true);
          };

          child.onTransformStart = () => {
            container.interactive = false;
          };
          child.onTransformEnd = () => {
            container.interactive = true;
          };
          container.addChild(child);
        }
      });
  }, [
    container,
    pieces,
    assets,
    config,
    onSelectPiece,
    selectedPieceIds,
    onUpdatePiece,
  ]);

  React.useEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  React.useLayoutEffect(updateDimensions, []);

  return {
    instance,
    setPieces,
    setConfig,
    // setAssets,
    stageRef,
    selectedPieceIds,
    setSelectedPieceIds,
  };

  // return (
  //   <div ref={stageRef} />
  //   // <Stage
  //   //   ref={stageRef}
  //   //   options={{ transparent: true }}
  //   //   width={dimensions.width}
  //   //   height={dimensions.height}
  //   // />
  // );
};
