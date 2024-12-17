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
  
  @State() _options: Option[] = []; // Lista de opciones disponibles
  @State() selectedOptions: Option[] = []; // Lista de opciones seleccionadas
  @State() isOpen: boolean = false; // Estado del desplegable

  @Element() el: HTMLElement;

  @Event() selectionChanged: EventEmitter<Option[]>; // Evento para emitir cambios de selección

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  componentWillLoad() {
    this._options = JSON.parse(this.options);
    console.log(this.selectedOptions)
  }

  selectOption(option: Option) {
    if (this.selectedOptions.findIndex(item => item.id === option.id) !== -1) {
      this.selectedOptions = this.selectedOptions.filter(item => item !== option);
    } else {
      this.selectedOptions = [...this.selectedOptions, option];
    }
    this.selectionChanged.emit(this.selectedOptions);
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
            this.selectedOptions.map(option => (
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
                  'selected': this.selectedOptions.findIndex(item => item.id === option.id) !== -1
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

