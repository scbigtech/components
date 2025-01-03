import { Component, Event, EventEmitter, Fragment, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'bt-column-search',
  styleUrl: 'bt-column-search.scss',
  shadow: true,
})
export class BtFilterDropdown {
  @Prop() type: 'string' | 'number' | 'select' | 'html' = 'string'; // Tipo de dato a filtrar
  @Prop() options: { label: string; value: string }[] = [];
  @Event() filterChange: EventEmitter<string>; // Evento que emite el regex generado
  @State() filterType: string = ''; // Tipo de filtro seleccionado
  @State() filterValue: string = ''; // Valor del filtro
  @State() rangeMin: string = ''; // Mínimo para rangos
  @State() rangeMax: string = ''; // Máximo para rangos

  private handleFilterTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterType = value;
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
    if (this.rangeMin && this.rangeMax) this.emitFilter();
  }

  private checkEnter(event: Event) {
    if ((event as KeyboardEvent).key === 'Enter') this.emitFilter();
  }

  private emitFilter() {
    let searchterm = '';
    if (this.filterType === 'range' && this.type === 'number') {
      const min = this.rangeMin ? `$gt:${this.rangeMin}` : '';
      const max = this.rangeMax ? `$lt:${this.rangeMax}` : '';
      searchterm = `[${min} && ${max}]`;
    } else if (this.filterType === 'startsWith') {
      searchterm = `[$regex:^${this.filterValue}]`;
    } else if (this.filterType === 'endsWith') {
      searchterm = `[$regex:${this.filterValue}$]`;
    } else if (this.filterType) {
      searchterm = `[${this.filterType}:${this.filterValue}]`;
    } else if (this.type === 'select') {
      searchterm = `[$eq:${this.filterValue}]`;
    } 
    else {
      searchterm = `${this.filterValue}`;
    }
    this.filterChange.emit(searchterm);
  }

  private numberActions = [
    { label: 'Entre', value: 'range' },
    { label: '=', value: '$eq' },
    { label: '!=', value: '$ne' },
    { label: '>', value: '$gt' },
    { label: '<', value: '$lt' },
    { label: '>=', value: '$gte' },
    { label: '<=', value: '$lte' },
  ];

  private stringActions = [
    { label: 'Contiene', value: '$regex' },
    { label: 'No contiene', value: '$nregex' },
    { label: 'Empieza por', value: 'startsWith' },
    { label: 'Termina en', value: 'endsWith' },
  ];

  private handleSelectOption(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterValue = value;
    this.emitFilter();
  }

  render() {
    return (
      <div class="filter-dropdown">
        {this.type !== 'select' && (
          <select onChange={this.handleFilterTypeChange.bind(this)}>
            <option value=""></option>
            {this.type === 'string' && (
              <Fragment>
                {this.stringActions.map(action => (
                  <option value={action.value}>{action.label}</option>
                ))}
              </Fragment>
            )}
            {this.type === 'number' && (
              <Fragment>
                {this.numberActions.map(action => (
                  <option value={action.value}>{action.label}</option>
                ))}
              </Fragment>
            )}
          </select>
        )}

        {this.filterType === 'range' && this.type === 'number' ? (
          <div class="range-inputs">
            <input type="number" placeholder="Mínimo" value={this.rangeMin} onChange={e => this.handleRangeChange(e, 'min')} />
            <input type="number" placeholder="Máximo" value={this.rangeMax} onChange={e => this.handleRangeChange(e, 'max')} />
          </div>
        ) : (
          this.type !== 'select' && (
            <Fragment>
              <input type="text" placeholder="Valor del filtro" value={this.filterValue} onChange={this.handleValueChange.bind(this)} onKeyUp={this.checkEnter.bind(this)} />
            </Fragment>
          )
        )}
        {this.type === 'select' && (
          <select onChange={this.handleSelectOption.bind(this)}>
            <option value=""></option>
            {this.options.map(option => (
              <option value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      </div>
    );
  }
}
