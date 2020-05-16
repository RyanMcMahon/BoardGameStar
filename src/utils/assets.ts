const fs = window.require('fs');

export function getFilename(file: string) {
  const [filename] = file.split(/\//g).reverse();
  return filename;
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
