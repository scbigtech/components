import { Component, Prop, State, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'bt-button',
  styleUrl: 'bt-button.scss',
  shadow: true,
})
export class btButton {
  @State() buttonState = {
    loading: false,
    disabled: false,
    success: false,
  };

  /**
   * Properties for controlling button states
   */
  @Prop({ reflect: true }) loading: boolean = false;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) success: boolean = false;

  @Prop({ reflect: true }) validate?: boolean;
  @Prop({ reflect: true }) hideText: boolean = false;

  /**
   * Event emitted when the button is clicked
   */
  @Event() btButtonClick: EventEmitter<{ valid: boolean }>;

  private handleClick() {
    if (this.disabled || this.loading) return;

    if (this.validate) {
      this.validateMethod().then(isValid => {
        if (!isValid) {
          console.warn('Validation failed!');
          return;
        }
        this.btButtonClick.emit({ valid: true });
      });
    } else {
      this.btButtonClick.emit({ valid: true });
    }
  }

  private async validateMethod(): Promise<boolean> {
    // Example async validation logic
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }

  render() {
    const buttonClass = {
      loading: this.loading,
      success: this.success,
    };

    return (
      <button disabled={this.disabled || this.loading} class={buttonClass} onClick={() => this.handleClick()}>
        <span class="button__content">
          <slot name="icon-left"></slot>
          <span class={`button__text ${this.hideText ? 'sr-only' : ''}`}>
            <slot></slot>
          </span>
          <slot name="icon-right"></slot>
        </span>
      </button>
    );
  }
}
