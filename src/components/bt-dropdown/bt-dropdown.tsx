import { Component, Element, Event, EventEmitter, Host, Listen, Prop, State, h } from '@stencil/core';
import { icons } from '../../assets/icons.js';

@Component({
  tag: 'bt-dropdown',
  styleUrl: 'bt-dropdown.scss',
  // shadow: true,
})
export class BtDropdown {
  @Prop() options: { [key: string]: any } = {};
  @Prop() x: 'left' | 'right' = 'left';
  @Prop() y: 'top' | 'bottom' = 'bottom';
  @Prop() buttonProps: { [key: string]: any } = {};
  @State() isOpen: boolean = false;
  @Element() el: HTMLElement;
  @Event({ eventName: 'action' }) onAction: EventEmitter<any>;

  @Listen('click', {target: 'window'})
  handleClickOutside(event: Event) {
    const path = (event.composedPath && event.composedPath()) || (event as any).path;
    if (path?.includes(this.el)) {
      return;
    }
    this.isOpen = false;
  }

  private toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  private handleClick(key: string) {
    this.isOpen = false;
    console.log(this.options, key)
    this.onAction.emit({ ...this.options[key], key });
  }

  render() {
    return (
      <Host>
        <div class="dropdown">
          <bt-button {...this.buttonProps} onClick={() => this.toggleDropdown()}>
            <span slot="icon-left" innerHTML={icons.menu}></span>
            <slot></slot>
          </bt-button>
          <ul class={`dropdown-menu ${this.isOpen ? 'open' : ''} ${this.x} ${this.y}`}>
            {Object.keys(this.options).map(key => (
              <li key={key} class={`dropdown-item`} onClick={() => this.handleClick(key)}>
                {this.options[key].icon && <span class="dropdown-item__icon" innerHTML={this.options[key].icon}></span>}
                {this.options[key].label}
              </li>
            ))}
          </ul>
        </div>
      </Host>
    );
  }
}
