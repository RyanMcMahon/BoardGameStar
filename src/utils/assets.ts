import { isWebBuild } from './meta';

window.require = window.require || (() => {});
const fs = window.require('fs');

export const imagePrefix = isWebBuild ? '/' : '';

export function getFilename(file: string) {
  const [filename] = file.split(/\//g).reverse();
  return filename;
}

export function isDataAsset(image: string) {
  return /^data:image/.test(image);
}

export function prependPrefix(image: string | undefined) {
  if (!image) {
    return '';
  }
  return isDataAsset(image) ? image : `${imagePrefix}${image}`;
}

export function loadAsset(file: string) {
  const [extension] = file.split('.').reverse();
  return `data:image/${extension};base64,${fs
    .readFileSync(file)
    .toString('base64')}`;
}

export function getAssetDimensions(asset: string) {
  return new Promise<{ width: number; height: number }>(resolve => {
    const i = new Image();
    i.onload = function() {
      resolve({
        width: i.width,
        height: i.height,
      });
    };
    i.src = asset;
  });
}
