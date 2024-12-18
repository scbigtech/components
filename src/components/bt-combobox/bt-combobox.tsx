import { v4 as uuidv4 } from 'uuid';
import { Component, State, h, Prop, Event, EventEmitter, Listen , Element} from '@stencil/core';

interface Option {
  id: number;
  name: string;
}
/**
 * TODO: revisar este componente , asignarle un identificador unico
 * para que las opciones seleccionadas solo afecten a este componente
 */

@Component({
  tag: 'bt-combobox',
  styleUrl: 'bt-combobox.scss',
  shadow: true,
})
export class MultiSelectCombobox {
  private id: string = uuidv4();

  @Prop() options: string = '';
  @Prop() selectedOptions: string = '';  
  @State() _options: Option[] = []; // Lista de opciones disponibles
  @State() _selectedOptions: Option[] = []; // Lista de opciones seleccionadas
  @State() isOpen: boolean = false; // Estado del desplegable

  @Element() el: HTMLElement;

  @Event({composed: true, bubbles: false, eventName: 'comboboxSelectionChange'}) selectionChange: EventEmitter<Option[]>; // Evento para emitir cambios de selección

  private toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  componentWillLoad() {
    this._options = JSON.parse(this.options);
    this._selectedOptions = JSON.parse(this.selectedOptions);
  }

  private selectOption(option: Option) {
    if (this._selectedOptions.findIndex(item => item.id === option.id) !== -1) {
      this._selectedOptions = this._selectedOptions.filter(item => item !== option);
    } else {
      this._selectedOptions = [...this._selectedOptions, option];
    }
    this.selectionChange.emit(this._selectedOptions);
  }

  @Listen('click', { target: 'window' })
  handleClickOutside(event: Event) {
    const path = (event.composedPath && event.composedPath()) || (event as any).path;
    if (path?.includes(this.el)) {
      return;
    }
    this.isOpen = false;
  }

  render() {
    return (
      <div class="combobox-container" data-combobox-id={this.id}>
        <div class="selected-items" onClick={() => this.toggleDropdown()}>
          {this.selectedOptions.length > 0 ? (
            this._selectedOptions.map(option => (
              <span class="selected-item">{option.name}</span>
            ))
          ) : (
            <span class="placeholder">Select options</span>
          )}
          <span class={`arrow ${this.isOpen ? 'open' : ''}`}>▲</span>
        </div>

        {this.isOpen && (
          <div class="dropdown">
            {this._options.map(option => (
              <div
                class={{ 
                  'dropdown-item': true, 
                  'selected': this._selectedOptions.findIndex(item => item.id === option.id) !== -1
                }}
                onClick={() => this.selectOption(option)}
              >
                {option.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

