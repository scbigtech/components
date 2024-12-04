import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'components',
  globalStyle: 'src/global/global.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'docs-json',
      file: 'components.json',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
};
