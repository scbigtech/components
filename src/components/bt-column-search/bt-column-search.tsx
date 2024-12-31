import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'bt-column-search',
  styleUrl: 'bt-column-search.scss',
  shadow: true,
})
export class BtFilterDropdown {
  @Prop() type: 'string' | 'number' | 'complex' = 'string'; // Tipo de dato a filtrar
  @Event() filterChange: EventEmitter<string>; // Evento que emite el regex generado
  @State() filterType: string = ''; // Tipo de filtro seleccionado
  @State() filterValue: string = ''; // Valor del filtro
  @State() rangeMin: string = ''; // Mínimo para rangos
  @State() rangeMax: string = ''; // Máximo para rangos

  private handleFilterTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterType = value;
    this.emitFilter();
  }

  private handleValueChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue = value;
    this.emitFilter();
  }

  private handleRangeChange(event: Event, field: 'min' | 'max') {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'min') this.rangeMin = value;
    if (field === 'max') this.rangeMax = value;
    this.emitFilter();
  }

  private emitFilter() {
    let regex = '';
    if (this.filterType === 'range' && this.type === 'number') {
      const min = this.rangeMin ? `>=${this.rangeMin}` : '';
      const max = this.rangeMax ? `<=${this.rangeMax}` : '';
      regex = `[${min} && ${max}]`;
    } else if (this.filterType === '$regex' || this.filterType === '$nregex') {
      regex = `[${this.filterType}:${this.filterValue}]`;
    } else if (this.filterType === 'startsWith') {
      regex = `[$regex:^${this.filterValue}]`;
    } else if (this.filterType === 'endsWith') {
      regex = `[$regex:${this.filterValue}$]`;
    }
    this.filterChange.emit(regex);
  }

  render() {
    return (
      <div class="filter-dropdown">
        <select onChange={this.handleFilterTypeChange.bind(this)}>
          <option value="">Seleccionar filtro</option>
          <option value="$regex">Contiene</option>
          <option value="$nregex">No contiene</option>
          <option value="startsWith">Empieza con</option>
          <option value="endsWith">Termina con</option>
          {this.type === 'number' && <option value="range">Entre</option>}
        </select>

        {this.filterType === 'range' && this.type === 'number' ? (
          <div class="range-inputs">
            <input type="number" placeholder="Mínimo" value={this.rangeMin} onInput={e => this.handleRangeChange(e, 'min')} />
            <input type="number" placeholder="Máximo" value={this.rangeMax} onInput={e => this.handleRangeChange(e, 'max')} />
          </div>
        ) : (
          <input type="text" placeholder="Valor del filtro" value={this.filterValue} onInput={this.handleValueChange.bind(this)} />
        )}
      </div>
    );
  }
}
