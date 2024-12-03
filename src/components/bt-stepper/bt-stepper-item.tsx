import { Component, h } from '@stencil/core';

@Component({
  tag: 'bt-step-item',
  shadow: true,
})
export class BtStepItem {
  render() {
    return <slot></slot>;
  }
}
