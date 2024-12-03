import { html } from 'lit-html';
import type { Meta, StoryFn  } from '@storybook/web-components';

const meta: Meta = {
  title: 'Components/bt-stepper',
  component: 'bt-stepper',
};

export default meta;
const style=`
  --stepper-border-color: #ddd;
  --indicator-bg: #f0f0f0;
  --indicator-active-bg: #e0001b;
  --indicator-completed-bg: #28a745;
  --indicator-invalid-bg: #dc3545;
  --button-bg: #e0001b;
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

  <script type="module">
    window.addEventListener('load', () => {
      const stepper = document.querySelector('bt-stepper');
      const checkbox = document.getElementById('step2-check');

      checkbox.addEventListener('change', () => {
        const isValid = checkbox.checked;
        stepper.setStepValidity(1, isValid);
      });

      // Inicializar la validez del primer paso
      console.log({ stepper });
      stepper.setStepValidity(1, checkbox.checked);
    });
  </script>
`;

export const Default = Template.bind({});
Default.storyName = 'Default Stepper';
