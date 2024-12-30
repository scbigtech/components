import { Component, Element, Event, EventEmitter, Host, Listen, Prop, State, h } from '@stencil/core';
import { icons } from '../../assets/icons.js';
import { OverflowFinder} from '../../utils/utils';

@Component({
  tag: 'bt-dropdown',
  styleUrl: 'bt-dropdown.scss',
  shadow: true,
})
export class BtDropdown {
  @Prop() options: { [key: string]: any } = {};
  @State() isOpen: boolean = false;
  @Element() el: HTMLElement;
  @Event({ eventName: 'action', composed: true, bubbles: true }) onAction: EventEmitter<any>;

  @Listen('click', { target: 'document' })
  handleClickOutside(event: Event) {
    const path = (event.composedPath && event.composedPath()) || (event as any).path;
    if (path?.includes(this.el)) {
      return;
    }
    this.isOpen = false;
  }

  connectedCallback() {
    this.getDropdownPosition();
  }

  private toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  private handleClick( key: string) {
    this.isOpen = false;
    this.onAction.emit({...this.options[key], key});
  }

  getDropdownPosition() {
    const overflowparent = OverflowFinder.find(this.el) || window;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const dropdownMenu = this.el.shadowRoot?.querySelector('.dropdown-menu');
            if (dropdownMenu) {
              const rect = dropdownMenu.getBoundingClientRect();
              if (rect.right > overflowparent.offsetWidth) {
                dropdownMenu.classList.add('right');
              }
              if (rect.left < 0) {
                dropdownMenu.classList.add('left');
              }
              if (rect.top < 0) {
                dropdownMenu.classList.add('top');
              }
              if (rect.bottom > overflowparent.offsetWidth) {
                dropdownMenu.classList.add('bottom');
              }

              observer.disconnect();
            }
          }
        });
      },
      {
        root: null,
        threshold: 1.0,
      },
    );

    observer.observe(this.el);
    return '';
  }
  render() {
    return (
      <Host>
        <div class="dropdown">
          <bt-button hideText onClick={() => this.toggleDropdown()}>
            <span slot="icon-left" innerHTML={icons.menu}></span>
            open menu
          </bt-button>
          <ul class={`dropdown-menu ${this.isOpen ? 'open' : ''} ${this.getDropdownPosition()}`}>
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
