import { detect } from 'detect-browser';

const browser = detect();

const desktopOS = ['Mac OS', 'Windows 10', 'Linux'];

export const supportedBrowser =
  browser?.name === 'chrome' ||
  browser?.name === 'edge' ||
  (browser?.name === 'firefox' && desktopOS.includes(browser.os || ''));

export const isWebBuild = true; //!!process.env.REACT_APP_WEB_BUILD;
