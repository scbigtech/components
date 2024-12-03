/** @type { import('@storybook/web-components').Preview } */
import { defineCustomElements } from '../loader';
defineCustomElements();

const preview = {
  parameters: {
    docs: {
      toc: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
