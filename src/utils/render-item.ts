import _ from 'lodash';
// import { Image, Group } from 'react-konva';
import { Container, Sprite, Texture, Graphics, utils } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';

// import { useAsset } from './utils';
// import { Assets } from '../../utils/game';
// import { PieceTransformer, useTransformer } from './PieceTransformer';
import {
  BoardPiece,
  CardPiece,
  ImageTokenPiece,
  PieceOption,
  RectPieceOption,
  RenderPiece,
} from '../types';
import { primaryColor } from './style';
import { Transformer } from './Transformer';

export type RenderItemPiece = RenderPiece & { height: number; width: number };

interface ImagePieceOptions {
  piece: RenderItemPiece;
  texture: Texture;
  onSync: (el: RenderItem, curPiece: RenderPiece) => void;
}

export class RenderItem extends Container {
  id: string;
  piece!: RenderItemPiece;
  data: any;
  resizeData: any;
  nonSelectClick: boolean;
  dragging: boolean;
  dragEnabled: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  onUpdate?: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }) => void;
  transforming: boolean;
  sprite: Sprite;
  transformer: Transformer;
  outline: Graphics;
  locked?: boolean;
  sendUpdateThrottled: () => void;
  onSync: (curPiece: RenderPiece) => void;

  constructor({ piece, texture, onSync }: ImagePieceOptions) {
    super();
    this.id = piece.id;
    this.cursor = 'grab';
    this.nonSelectClick = false;
    this.dragging = false;
    this.interactive = true;
    this.dragEnabled = true;
    this.transforming = false;
    this.outline = new Graphics();
    this.onSync = (curPiece: RenderPiece) => onSync(this, curPiece);
    this.sendUpdateThrottled = _.throttle(this.sendUpdate, 50, {
      leading: false,
      trailing: true,
    });

    const sprite = new Sprite(texture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.height = piece.height;
    sprite.width = piece.width;
    this.addChild(sprite);
    this.sprite = sprite;

    this.setPiece(piece);

    const transformer = new Transformer({
      dimensions: this.piece,

      onRotate: (angle: number) => {
        this.updatePiece({ ...this.piece, rotation: angle });
      },

      onTransform: dimensions => {
        this.updateOutline();
        this.nonSelectClick = true;
        this.updatePiece({ ...this.piece, ...dimensions });
      },

      onTransformStart: () => {
        this.transforming = true;
        if (this.onTransformStart) {
          this.onTransformStart();
        }
      },

      onTransformEnd: () => {
        this.transforming = false;
        transformer.setDimensions(this.sprite);
        if (this.onTransformEnd) {
          this.onTransformEnd();
        }
      },
    });

    this.transformer = transformer;
    this.setPosition(piece);
    this.setDimensions(piece);

    this
      // events for drag start
      .on('mousedown', this.handleDragStart)
      .on('touchstart', this.handleDragStart)
      // events for drag end
      .on('mouseup', this.handleDragEnd)
      .on('mouseupoutside', this.handleDragEnd)
      .on('touchend', this.handleDragEnd)
      .on('touchendoutside', this.handleDragEnd)
      // events for drag move
      .on('mousemove', this.handleDragMove)
      .on('touchmove', this.handleDragMove);
  }

  updateOutline() {
    const transformerColor = utils.string2hex(primaryColor);
    const outline = this.outline;
    outline.clear();
    outline.beginFill(transformerColor);
    outline.drawRect(0, -2, this.piece.width, 2);
    outline.drawRect(0, this.piece.height, this.piece.width, 2);
    outline.drawRect(this.piece.width, 0, 2, this.piece.height);
    outline.drawRect(-2, 0, 2, this.piece.height);
    this.outline = outline;
  }

  handleDragStart(event: any) {
    if (!this.dragEnabled || this.transforming || this.locked) {
      return;
    }

    this.nonSelectClick = false;

    const pointer = event.data.getLocalPosition(this.parent);
    const pointerOffset = {
      x: pointer.x + this.piece.width / 2 - this.x,
      y: pointer.y + this.piece.height / 2 - this.y,
    };
    this.data = {
      ...event.data,
      pointerOffset,
    };
    this.dragging = true;
    this.cursor = 'grabbing';

    if (this.onTransformStart) {
      this.onTransformStart();
    }
  }

  handleDragEnd() {
    this.dragging = false;
    this.data = null;
    this.cursor = 'grab';
    if (this.onTransformEnd) {
      this.onTransformEnd();
    }
  }

  handleDragMove(event: any) {
    if (!this.dragging) {
      return;
    }
    this.nonSelectClick = true;
    const pointer = event.data.getLocalPosition(this.parent);
    const newPos = {
      x: pointer.x - this.data.pointerOffset.x,
      y: pointer.y - this.data.pointerOffset.y,
    };

    this.updatePiece({ ...this.piece, ...newPos });
  }

  select() {
    this.addChild(this.transformer);
    this.addChild(this.outline);
    this.updateOutline();
  }

  deselect() {
    this.removeChild(this.transformer);
    this.removeChild(this.outline);
  }

  setPosition(point: { x: number; y: number }) {
    this.x = point.x + this.piece.width / 2;
    this.y = point.y + this.piece.height / 2;
  }

  setDimensions({ width, height }: { width: number; height: number }) {
    this.sprite.width = width;
    this.sprite.height = height;
    this.pivot.set(width / 2, height / 2);
  }

  updatePiece(newPiece: Partial<RenderItemPiece>) {
    this.setPiece({
      ...this.piece,
      ...newPiece,
    } as RenderItemPiece);
    this.sendUpdateThrottled();
  }

  setPiece(piece: RenderItemPiece) {
    this.piece = { ...piece };
    this.angle = piece.rotation || 0;
    this.zIndex = piece.layer;
    // this.pivot.set(piece.width / 2, piece.height / 2);
    this.setPosition(piece);
    this.setDimensions(piece);
    this.onSync(piece);
  }

  sendUpdate() {
    if (this.onUpdate) {
      this.onUpdate({ rotation: 0, ...this.piece });
      //   rotation: this.angle,
      //   width: this.sprite.width,
      //   height: this.sprite.height,
      //   x: this.x - this.sprite.width / 2,
      //   y: this.y - this.sprite.height / 2,
      // });
    }
  }
}
