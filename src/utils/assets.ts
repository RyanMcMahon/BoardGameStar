import { isWebBuild } from './meta';

window.require = window.require || (() => {});
const fs = window.require('fs');
const path = window.require('path');

export interface UploadedFile {
  content: string;
  type: string;
  name: string;
}

export const imagePrefix = isWebBuild ? '/' : '';

export function getFilename(file: string) {
  return path.basename(file);
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

export async function filePrompt(): Promise<UploadedFile[]> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = async (e: any) => {
      if (!e.target) {
        return;
      }

      const files = await Promise.all<UploadedFile>(
        Array.from<File>(e.target.files).map(
          (file: File) =>
            new Promise(resolve => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = async readerEvent => {
                const content = readerEvent?.target?.result as string;
                resolve({
                  name: file.name,
                  type: file.type,
                  content,
                });
              };
            })
        )
      );

      resolve(files);
    };

    input.click();
  });
}
