/** @type { import('@storybook/web-components').Preview } */
import { defineCustomElements } from '../loader';

defineCustomElements();

const preview = {
  parameters: {
    docs: {
      toc: true,
    },
  },
};

export default preview;
