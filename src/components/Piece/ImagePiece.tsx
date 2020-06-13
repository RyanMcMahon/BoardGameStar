import React from 'react';
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
} from '../../types';
import { primaryColor } from '../../utils/style';
import { Transformer } from './Transformer';

interface ImagePieceOptions extends RectPieceOption {
  type: string;
  texture: Texture;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}

export class ImagePiece extends Container {
  id: string;
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

  constructor(options: ImagePieceOptions) {
    super();
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.angle = options.rotation || 0;
    this.zIndex = options.layer;
    // this.filters = [new OutlineFilter(10, utils.string2hex(primaryColor))];
    this.cursor = 'grab';
    this.nonSelectClick = false;
    this.dragging = false;
    this.interactive = true;
    this.dragEnabled = true;
    this.pivot.set(options.width / 2, options.height / 2);
    this.onTransformStart = options.onTransformStart;
    this.onTransformEnd = options.onTransformEnd;
    this.transforming = false;
    this.outline = new Graphics();

    const sprite = new Sprite(options.texture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.height = options.height;
    sprite.width = options.width;
    this.addChild(sprite);
    this.sprite = sprite;

    const transformer = new Transformer({
      dimensions: sprite,
      onRotate: (angle: number) => {
        this.angle = angle;
        if (this.onUpdate) {
          this.onUpdate({
            rotation: this.angle,
            width: this.sprite.width,
            height: this.sprite.height,
            x: this.position.x,
            y: this.position.y,
          });
        }
      },
      onTransform: ({ width, height }) => {
        this.sprite.width = width;
        this.sprite.height = height;
        this.pivot.set(width / 2, height / 2);
        this.updateOutline();
        this.nonSelectClick = true;

        if (this.onUpdate) {
          this.onUpdate({
            rotation: this.angle,
            width: this.sprite.width,
            height: this.sprite.height,
            x: this.position.x,
            y: this.position.y,
          });
        }
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

    // this.addChild(transformer);

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
    outline.drawRect(0, -2, this.sprite.width, 2);
    outline.drawRect(0, this.sprite.height, this.sprite.width, 2);
    outline.drawRect(this.sprite.width, 0, 2, this.sprite.height);
    outline.drawRect(-2, 0, 2, this.sprite.height);
    this.outline = outline;
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

  handleDragStart(event: any) {
    if (!this.dragEnabled || this.transforming || this.locked) {
      return;
    }

    this.nonSelectClick = false;

    const localPosition = event.data.getLocalPosition(this.parent);
    const pointerOffset = {
      x: localPosition.x - this.x,
      y: localPosition.y - this.y,
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
    const newPosition = event.data.getLocalPosition(this.parent);
    this.position.x = newPosition.x - this.data.pointerOffset.x;
    this.position.y = newPosition.y - this.data.pointerOffset.y;

    if (this.onUpdate) {
      this.onUpdate({
        rotation: this.angle,
        width: this.sprite.width,
        height: this.sprite.height,
        x: this.position.x,
        y: this.position.y,
      });
    }
  }
}
