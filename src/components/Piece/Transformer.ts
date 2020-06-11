import {
  Rectangle,
  Container,
  Sprite,
  Texture,
  Graphics,
  utils,
} from 'pixi.js';
import { primaryColor } from '../../utils/style';

interface TransformerOptions {
  dimensions: {
    width: number;
    height: number;
  };
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onTransform: (dimensions: { width: number; height: number }) => void;
}

const HANDLE_SIZE = 8;
export class Transformer extends Container {
  resizeData: any;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onTransform: (dimensions: { width: number; height: number }) => void;
  resizing: boolean;
  curDimensions: {
    width: number;
    height: number;
  };

  resizeHandles: {
    handle: Sprite;
    setPosition: (width: number, height: number) => void;
  }[];

  constructor(options: TransformerOptions) {
    super();
    this.interactive = true;
    this.onTransformStart = options.onTransformStart;
    this.onTransformEnd = options.onTransformEnd;
    this.onTransform = options.onTransform;
    this.resizing = false;
    this.curDimensions = options.dimensions;

    this.resizeHandles = [];
    [
      // Top Left
      {
        getPosition: () => ({
          x: -HANDLE_SIZE,
          y: -HANDLE_SIZE,
        }),
        constraint: { x: -1, y: -1 },
      },
      // Top Middle
      {
        getPosition: (width: number) => ({
          x: width / 2 - HANDLE_SIZE / 2,
          y: -HANDLE_SIZE,
        }),
        constraint: { x: 0, y: -1 },
      },
      // Top Right
      {
        getPosition: (width: number) => ({
          x: width,
          y: -HANDLE_SIZE,
        }),
        constraint: { x: 1, y: -1 },
      },
      // Middle Right
      {
        getPosition: (width: number, height: number) => ({
          x: width,
          y: height / 2 - HANDLE_SIZE / 2,
        }),
        constraint: { x: 1, y: 0 },
      },
      // Bottom Right
      {
        getPosition: (width: number, height: number) => ({
          x: width,
          y: height,
        }),
        constraint: { x: 1, y: 1 },
      },
      // Bottom Middle
      {
        getPosition: (width: number, height: number) => ({
          x: width / 2 - HANDLE_SIZE / 2,
          y: height,
        }),
        constraint: { x: 0, y: 1 },
      },
      // Bottom Left
      {
        getPosition: (width: number, height: number) => ({
          x: -HANDLE_SIZE,
          y: height,
        }),
        constraint: { x: -1, y: 1 },
      },
      // Middle Left
      {
        getPosition: (width: number, height: number) => ({
          x: -HANDLE_SIZE,
          y: height / 2 - HANDLE_SIZE / 2,
        }),
        constraint: { x: -1, y: 0 },
      },
    ].forEach(point => {
      const handle = new Sprite(Texture.WHITE);
      handle.interactive = true;
      handle.cursor = 'crosshair';
      handle.tint = utils.string2hex(primaryColor);
      handle.width = HANDLE_SIZE;
      handle.height = HANDLE_SIZE;

      const rectangle = new Graphics();
      rectangle.beginFill(0xffffff);
      rectangle.drawRect(
        HANDLE_SIZE / 2,
        HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
      rectangle.endFill();

      handle.addChild(rectangle);

      this.addChild(handle);
      this.resizeHandles.push({
        handle,
        setPosition: (width: number, height: number) => {
          const position = point.getPosition(width, height);
          handle.x = position.x;
          handle.y = position.y;
        },
      });

      const handleResizeStart = (event: any) => {
        this.resizing = true;

        this.resizeData = {
          startPosition: event.data.getLocalPosition(this.parent),
          constraint: point.constraint,
        };

        this.onTransformStart();
      };

      const handleResizeEnd = (event: any) => {
        this.resizing = false;
        this.resizeData = null;
        this.onTransformEnd();
      };

      const handleResizeMove = (event: any) => {
        if (!this.resizing) {
          return;
        }

        const { startPosition, constraint } = this.resizeData;
        const localPosition = event.data.getLocalPosition(this.parent);
        const diff = {
          x: localPosition.x - startPosition.x,
          y: localPosition.y - startPosition.y,
        };

        const dimensions = {
          width: this.curDimensions.width + diff.x * constraint.x,
          height: this.curDimensions.height + diff.y * constraint.y,
        };

        this.resizeHandles.forEach(({ setPosition }) =>
          setPosition(dimensions.width, dimensions.height)
        );
        this.onTransform(dimensions);
      };

      handle
        // events for resize start
        .on('mousedown', handleResizeStart)
        .on('touchstart', handleResizeStart)
        // events for resize end
        .on('mouseup', handleResizeEnd)
        .on('mouseupoutside', handleResizeEnd)
        .on('touchend', handleResizeEnd)
        .on('touchendoutside', handleResizeEnd)
        // events for resize move
        .on('mousemove', handleResizeMove)
        .on('touchmove', handleResizeMove);
    });

    this.setDimensions(options.dimensions);
  }

  setDimensions({ width, height }: { width: number; height: number }) {
    this.resizeHandles.forEach(({ setPosition }) => setPosition(width, height));
    this.curDimensions = {
      width,
      height,
    };
  }
}
