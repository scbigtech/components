import { html } from 'lit-html';
import type { Meta, StoryFn  } from '@storybook/web-components';

const meta: Meta = {
  title: 'Components/bt-stepper',
  component: 'bt-stepper',
};

export default meta;
const style=`
  --primary-hue: 10;
  --b
`

const Template: StoryFn = () => html`
  <bt-stepper style="${style}">
    <bt-step-item>Step 1: Welcome</bt-step-item>
    <bt-step-item>
      Step 2: Personal Details
      <input type="checkbox" id="step2-check" />
      <label for="step2-check">Accept</label>
    </bt-step-item>
    <bt-step-item>Step 3: Payment</bt-step-item>
    <bt-step-item>Step 4: Confirmation</bt-step-item>
  </bt-stepper>
`;

export const Default = Template.bind({});
Default.storyName = 'Default Stepper';
