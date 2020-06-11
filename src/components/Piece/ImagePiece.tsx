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
  dragging: boolean;
  dragEnabled: boolean;
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  transforming: boolean;
  sprite: Sprite;
  outlines: Graphics[];

  constructor(options: ImagePieceOptions) {
    super();
    this.id = options.id;
    this.x = options.x;
    this.y = options.y;
    this.zIndex = options.layer;
    // this.filters = [new OutlineFilter(10, utils.string2hex(primaryColor))];
    this.cursor = 'grab';
    this.dragging = false;
    this.interactive = true;
    this.dragEnabled = true;
    this.onTransformStart = options.onTransformStart;
    this.onTransformEnd = options.onTransformEnd;
    this.transforming = false;
    this.outlines = [];

    const sprite = new Sprite(options.texture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.height = options.height;
    sprite.width = options.width;
    this.addChild(sprite);
    this.sprite = sprite;
    this.updateOutline();

    const transformer = new Transformer({
      dimensions: sprite,
      onTransform: ({ width, height }) => {
        this.sprite.width = width;
        this.sprite.height = height;
        this.updateOutline();
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

    this.addChild(transformer);

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
    const topLine = new Graphics();
    topLine.beginFill(transformerColor);
    topLine.drawRect(0, -2, this.sprite.width, 2);
    this.addChild(topLine);
    const bottomLine = new Graphics();
    bottomLine.beginFill(transformerColor);
    bottomLine.drawRect(0, this.sprite.height, this.sprite.width, 2);
    this.addChild(bottomLine);
    const rightLine = new Graphics();
    rightLine.beginFill(transformerColor);
    rightLine.drawRect(this.sprite.width, 0, 2, this.sprite.height);
    this.addChild(rightLine);
    const leftLine = new Graphics();
    leftLine.beginFill(transformerColor);
    leftLine.drawRect(-2, 0, 2, this.sprite.height);
    this.addChild(leftLine);

    this.outlines.forEach(child => this.removeChild(child));
    this.outlines = [topLine, bottomLine, rightLine, leftLine];
  }

  handleDragStart(event: any) {
    if (!this.dragEnabled || this.transforming) {
      return;
    }

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
    if (this.dragging) {
      const newPosition = event.data.getLocalPosition(this.parent);
      this.position.x = newPosition.x - this.data.pointerOffset.x;
      this.position.y = newPosition.y - this.data.pointerOffset.y;
    }
  }
}
