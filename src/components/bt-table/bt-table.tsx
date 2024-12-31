import { Component, Event, EventEmitter, Fragment, Listen, Method, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'bt-table',
  styleUrl: 'bt-table.scss',
  shadow: false,
})
export class BtTable {
  @Prop() headers: {
    key: string;
    label: string;
    class: string;
    type: 'string' | 'number' | 'complex';
    cellClasses?: (cell: { [key: string]: any }) => string;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    action?: boolean;
  }[] = [];
  @Prop() rows: { [key: string]: any }[] = [];
  @Prop() actions: { [key: string]: (row: { [key: string]: any }) => void } = {};
  /**
   * Flag to indicate if the table has async data
   * handles search and pagination
   */
  @Prop() isAsync: boolean = false;
  @Prop() pageSize: number = 5;
  @Prop() totalRows?: number;
  @Prop() config: { [key: string]: any } = {
    caption: 'Data table',
    next: 'Next',
    prev: 'Previous',
    emptyData: 'No data',
    loading: 'Loading...',
    error: 'Error',
    pagesize: 'Rows per page',
    page: 'Page',
    rows: 'Rows',
    select: 'Select',
    selectall: 'Select all',
    search: 'Search',
    sort: 'Sort',
    filter: 'Filter',
    actions: 'Actions',
  };

  private initialState: {
    filteredRows: { [key: string]: any }[];
    searchText: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' | undefined };
    currentPage: number;
    columnFilters: { [key: string]: string };
    selectedRows: Set<string>;
    totalPages: number;
    internalTotalRows: number;
    paginationSize: number;
  } = {
    filteredRows: [],
    searchText: '',
    sortConfig: { key: '', direction: undefined },
    currentPage: 1,
    columnFilters: {},
    selectedRows: new Set(),
    totalPages: 1,
    internalTotalRows: 0,
    paginationSize: this.pageSize,
  };

  @State() filteredRows: { [key: string]: any }[] = this.initialState.filteredRows;
  @State() searchText: string = this.initialState.searchText;
  @State() sortConfig: { key: string; direction: 'asc' | 'desc' | undefined } = this.initialState.sortConfig;
  @State() currentPage: number = this.initialState.currentPage;
  @State() columnFilters: { [key: string]: string } = this.initialState.columnFilters;
  @State() selectedRows: Set<string> = this.initialState.selectedRows;
  @State() totalPages: number = this.initialState.totalPages;
  @State() internalTotalRows: number = this.initialState.internalTotalRows;
  @State() paginationSize: number = this.initialState.paginationSize;
  @State() parsedActions: { [key: string]: string } = {};

  @Event({ composed: true, bubbles: true }) search: EventEmitter<{ searchText: string }>;
  @Event({ eventName: 'selection', composed: true, bubbles: true }) rowSelect: EventEmitter<{ [key: string]: any }>;
  @Event({ eventName: 'page-size', composed: true, bubbles: true }) pageSizeChange: EventEmitter<{ [key: string]: any }>;
  @Event({ composed: true, bubbles: true }) pagination: EventEmitter<{ [key: string]: any }>;
  @Event({ composed: true, bubbles: true }) sort: EventEmitter<{ key: string; direction: 'asc' | 'desc' | undefined }>;
  @Event({ composed: true, bubbles: true }) filter: EventEmitter<{ filters: { [key: string]: string } }>;
  @Event({ eventName: 'cell-action', composed: true, bubbles: true }) onCellAction: EventEmitter<{ rowId: string; action: string }>;
  @Event({ eventName: 'edit', composed: true, bubbles: true }) cellEdit: EventEmitter<{ header: string; row: { [key: string]: any } }>;

  @Watch('rows')
  onRowsChange() {
    this.updateRows();
  }

  /**
   * Returns all selected rows.
   * @returns {Promise<{ [key: string]: any }[]>}
   */
  @Method()
  async getAllSelectedRows(): Promise<{ [key: string]: any }[]> {
    return this.rows.filter(row => this.selectedRows.has(row.id));
  }

  @Method()
  async getAllFilteredRows(): Promise<{ [key: string]: any }[]> {
    return this.filteredRows;
  }
  /**
   * Applies the filters to the table when the 'isAsync' property is set to true.
   * If the 'isAsync' property is set to false, a warning is logged to the console.
   * @returns {Promise<void>}
   */
  @Method()
  async applyAsyncSearch(): Promise<void> {
    if (this.isAsync) this.applyFilters();
    else {
      console.warn("The 'applyAsyncSearch' method can only be called when the 'isAsync' property is set to true.");
      return null;
    }
  }

  @Method()
  async resetTable() {
    this.filteredRows = [...this.rows];
    this.searchText = this.initialState.searchText;
    this.currentPage = this.initialState.currentPage;
    this.columnFilters = this.initialState.columnFilters;
    this.selectedRows = this.initialState.selectedRows;
  }

  @Listen('action')
  emitCellAction(event: CustomEvent<any>) {
    const target = event.composedPath().find(r => (r as HTMLElement).tagName === 'TR');
    const row = this.rows.find(r => r.id === (target as HTMLElement).dataset.id);
    this.onCellAction.emit({ rowId: row.id, action: event.detail });
  }

  componentWillLoad() {
    this.initializeFilters();
  }

  private updateRows() {
    if (!this.validateRows()) {
      console.error('Invalid rows. Each row must match the keys defined in headers.');
      this.filteredRows = [];
      return;
    }
    if (this.totalRows === undefined) {
      this.internalTotalRows = this.rows.length;
    } else {
      this.internalTotalRows = this.totalRows;
    }

    this.filteredRows = [...this.rows];
    this.applyFilters();
  }

  private validateRows(): boolean {
    if (!this.rows || !Array.isArray(this.rows)) {
      console.warn('rows is invalid or not set');
      return false;
    }
    if (!this.rows.every(row => typeof row === 'object')) {
      console.warn('rows must be an array of objects');
      return false;
    }

    if (!this.rows.every(row => !!row.id)) {
      console.warn('All rows must have an id');
      return false;
    }

    const headerKeys = this.headers.map(header => header.key);
    return this.rows.every(row => {
      headerKeys.forEach(key => {
        if (!(key in row)) {
          row[key] = undefined;
        }
      });
      return true;
    });
  }

  private initializeFilters() {
    const filters: { [key: string]: string } = {};
    this.headers.forEach(header => {
      if (header.filterable) filters[header.key] = '';
    });
    this.columnFilters = filters;
  }

  private handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.toLowerCase();
    if (!this.isAsync) this.applyFilters();
    this.search.emit({ searchText: this.searchText });
  }

  private handleSort(header: string) {
    if (!this.headers.find(h => h.key === header && h.sortable)) return;
    // Toggle sort direction if the same header is clicked. If is third click disabled
    let direction: 'asc' | 'desc' | undefined;
    if (this.sortConfig.key === header) {
      if (this.sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (this.sortConfig.direction === 'desc') {
        direction = undefined;
      }
    } else {
      direction = 'asc';
    }
    this.sortConfig = direction === undefined ? { key: undefined, direction: undefined } : { key: header, direction };
    this.applyFilters();
    this.sort.emit(this.sortConfig);
  }

  private handleColumnFilterChange(header: string, event: CustomEvent<any>) {
    const regex = event.detail; // Regex generado por el dropdown
    this.columnFilters = { ...this.columnFilters, [header]: regex };
    this.applyFilters();
    this.filter.emit({ filters: this.columnFilters });
  }

  private applyFilters() {
    let rows = [...this.rows];

    // Global search filter
    if (this.searchText && this.searchText.length > 0) {
      rows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(this.searchText));
    }

    // Column-specific filters
    Object.entries(this.columnFilters).forEach(([key, value]) => {
      if (value) {
        
        rows = rows.filter(row => this.evaluateFilter(row[key], value));
      }
    });

    // Sorting
    if (this.sortConfig.key) {
      rows.sort((a, b) => {
        const valueA = a[this.sortConfig.key];
        const valueB = b[this.sortConfig.key];
        if (valueA < valueB) return this.sortConfig.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredRows = rows;
    this.currentPage = 1;
    this.internalTotalRows = this.filteredRows.length;
  }

  private evaluateFilter(columnValue: any, filterValue: string): boolean {
    // Regex para detectar combinaciones de operadores
    const combinedMatch = filterValue.match(/^\[(.+?)\]$/);
    if (combinedMatch) {
      const expressions = combinedMatch[1].split('&&').map(exp => exp.trim());
      return expressions.every(expression => this.evaluateSingleCondition(columnValue, expression));
    }

    // Si no es una combinación, evaluar como una sola condición
    return this.evaluateSingleCondition(columnValue, filterValue);
  }

  /**
   * Evalúa una sola condición.
   */
  private evaluateSingleCondition(columnValue: number | string, condition: string): boolean {
    // Regex para identificar operadores avanzados
    const match = condition.match(/^\s*(\$(eq|ne|lt|lte|gt|gte|regex|nregex)):\s*(.+)\s*$/i);
    if (match) {
      const operator = match[1].toLowerCase(); // Operador como $eq, $lt, etc.
      const value = match[3].trim(); // Valor para comparar

      if (typeof columnValue === 'number') {
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) return false; // Validar que el valor sea numérico

        switch (operator) {
          case '$eq':
            return columnValue === numberValue;
          case '$ne':
            return columnValue !== numberValue;
          case '$lt':
            return columnValue < numberValue;
          case '$lte':
            return columnValue <= numberValue;
          case '$gt':
            return columnValue > numberValue;
          case '$gte':
            return columnValue >= numberValue;
          default:
            return false;
        }
      }

      if (typeof columnValue === 'string') {
        const columnText = columnValue.toLowerCase();
        const regexValue = value.toLowerCase();

        switch (operator) {
          case '$eq':
            return columnText === regexValue;
          case '$ne':
            return columnText !== regexValue;
          case '$regex':
            return new RegExp(regexValue, 'i').test(columnText);
          case '$nregex':
            return !new RegExp(regexValue, 'i').test(columnText);
          default:
            return false;
        }
      }
    }

    // Comparación por defecto
    if (typeof columnValue === 'string') {
      return columnValue.toLowerCase().includes(condition.toLowerCase());
    }

    if (typeof columnValue === 'number') {
      return columnValue.toString().includes(condition);
    }

    return false; // Caso no reconocido
  }
  private async handleRowSelection(id: string) {
    const selected = new Set(this.selectedRows);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedRows = selected;

    const selectedRow = this.rows.find(row => row.id === id);
    this.rowSelect.emit({ selectedRow, selectedRows: await this.getAllSelectedRows() });
  }

  private async handleSelectAll() {
    const visibleRows = this.paginatedRows.map(row => row.id);
    const selected = new Set(this.selectedRows);

    if (this.isAllSelected()) {
      // Si todas están seleccionadas, deseleccionarlas
      visibleRows.forEach(id => selected.delete(id));
    } else {
      // Si no todas están seleccionadas, seleccionarlas
      visibleRows.forEach(id => selected.add(id));
    }

    this.selectedRows = selected;
    this.rowSelect.emit(await this.getAllSelectedRows());
  }

  private isAllSelected(): boolean {
    if (this.filteredRows.length === 0) return false;
    const visibleRows = this.paginatedRows.map(row => row.id);
    return visibleRows.every(id => this.selectedRows.has(id));
  }

  private handlePageChange(newPage: number) {
    //Si no es +1 se muestra la tabla vacia porque se llena la pagina anterior pero no la seleccionada
    // revisar con get paginatedrows
    this.currentPage = newPage;
    this.pagination.emit({ page: newPage, pageSize: this.pageSize });
  }

  private get paginatedRows(): { [key: string]: any }[] {
    const start = (this.currentPage - 1) * this.paginationSize;
    const end = Math.min(start + 1 + this.paginationSize - 1, this.internalTotalRows);
    return this.filteredRows.slice(start, end);
  }

  private renderPagination() {
    const totalPages = Math.ceil(this.internalTotalRows / this.paginationSize);
    const start = (this.currentPage - 1) * this.paginationSize + 1;
    const end = Math.min(start + this.paginationSize - 1, this.internalTotalRows);
    return (
      <footer class="pagination">
        <div class="pagination-info">
          <span>
            {this.config.page} {start} - {end} ({this.internalTotalRows} {this.config.rows})
          </span>
        </div>
        <div class="pagination-buttons">
          <bt-button hideText={true} disabled={this.currentPage === 1} onClick={() => this.handlePageChange(1)}>
            <svg
              slot="icon-left"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M11 7l-5 5l5 5" />
              <path d="M17 7l-5 5l5 5" />
            </svg>
            <span>{this.config.first}</span>
          </bt-button>
          <bt-button hideText={true} disabled={this.currentPage === 1} onClick={() => this.handlePageChange(this.currentPage - 1)}>
            <svg
              slot="icon-left"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M15 6l-6 6l6 6" />
            </svg>
            <span>{this.config.prev}</span>
          </bt-button>
          {this.filteredRows.length > 0 &&
            totalPages > 1 &&
            (() => {
              const pages = [];
              if (totalPages <= 3) {
                // Menos de 3 páginas: mostrar todas
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else if (this.currentPage === 1) {
                // Primera página
                pages.push(1, 2, 3);
              } else if (this.currentPage === totalPages) {
                // Última página
                pages.push(totalPages - 2, totalPages - 1, totalPages);
              } else {
                // Página intermedia
                pages.push(this.currentPage - 1, this.currentPage, this.currentPage + 1);
              }

              return pages.map(page => (
                <bt-button class={this.currentPage === page ? 'active' : ''} onClick={() => this.handlePageChange(page)}>
                  {page}
                </bt-button>
              ));
            })()}
          <bt-button hideText={true} disabled={this.currentPage === totalPages} onClick={() => this.handlePageChange(this.currentPage + 1)}>
            <span>{this.config.next}</span>
            <svg
              slot="icon-right"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M9 6l6 6l-6 6" />
            </svg>
          </bt-button>
          <bt-button hideText={true} disabled={this.currentPage === totalPages} onClick={() => this.handlePageChange(totalPages)}>
            <span>{this.config.last}</span>
            <svg
              slot="icon-right"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M7 7l5 5l-5 5" />
              <path d="M13 7l5 5l-5 5" />
            </svg>
          </bt-button>
        </div>
      </footer>
    );
  }

  private handlePageSizeChange(event: Event) {
    const input = event.target as HTMLSelectElement;
    this.paginationSize = parseInt(input.value, 10);
    this.currentPage = 1;
    this.pageSizeChange.emit({ pageSize: this.paginationSize });
    this.updateRows();
  }

  private handleCellEdit(row: { [key: string]: any }, header: string, event: Event) {
    const input = event.target as HTMLInputElement;
    row[header] = input.textContent;
    this.cellEdit.emit({ header, row });
  }

  render() {
    if (!this.isAsync && this.rows.length === 0) {
      return (
        <section class="table-container">
          <div class="table-empty">
            <p>{this.config.emptyData}</p>
            <img src="/assets/img/empty-data.svg" alt="no data" width={300} height={300} />
          </div>
        </section>
      );
    }
    if (this.isAsync && this.rows.length === 0) {
      return <p>{this.config.loading}</p>;
    }
    return (
      <section class="table-container">
        <h2 part="heading-1">{this.config.caption}</h2>
        {/* Search */}
        <header class="toolbar">
          <search class="search-container">
            <div>
              <input type="text" placeholder={this.config.search} value={this.searchText} onInput={this.handleSearch.bind(this)} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                <path d="M21 21l-6 -6" />
              </svg>
            </div>
          </search>
          <label class="page-size-selector">
            <span>{this.config.pagesize}</span>
            <select onInput={this.handlePageSizeChange.bind(this)}>
              <option value="" disabled selected>
                {this.paginationSize}
              </option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
        </header>

        {/* Table */}
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '0' }}>
                  <label class="sr-only" htmlFor="select-all">
                    {this.config.selectall}
                  </label>
                  <input id="select-all" class="selection-checkbox" type="checkbox" checked={this.isAllSelected()} onChange={() => this.handleSelectAll()} />
                </th>
                {this.headers.map(header => (
                  <th class={header.class}>
                    <div>
                      <span class="header-title" onClick={() => this.handleSort(header.key)}>
                        {this.sortConfig.key === header.key &&
                          (this.sortConfig.direction ? (
                            <span class="sort-icon">
                              {this.sortConfig.direction === 'asc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                  <path d="M16.852 5.011l.058 -.007l.09 -.004l.075 .003l.126 .017l.111 .03l.111 .044l.098 .052l.104 .074l.082 .073l3 3a1 1 0 1 1 -1.414 1.414l-1.293 -1.292v9.585a1 1 0 0 1 -2 0v-9.585l-1.293 1.292a1 1 0 0 1 -1.32 .083l-.094 -.083a1 1 0 0 1 0 -1.414l3 -3q .053 -.054 .112 -.097l.11 -.071l.114 -.054l.105 -.035z" />
                                  <path d="M9.5 4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-4a1.5 1.5 0 0 1 1.5 -1.5z" />
                                  <path d="M9.5 13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-4a1.5 1.5 0 0 1 1.5 -1.5z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                  <path d="M9.5 4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-4a1.5 1.5 0 0 1 1.5 -1.5z" />
                                  <path d="M9.5 13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1 -1.5 1.5h-4a1.5 1.5 0 0 1 -1.5 -1.5v-4a1.5 1.5 0 0 1 1.5 -1.5z" />
                                  <path d="M17 5a1 1 0 0 1 1 1v9.584l1.293 -1.291a1 1 0 0 1 1.32 -.083l.094 .083a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1 -.112 .097l-.11 .071l-.114 .054l-.105 .035l-.149 .03l-.117 .006l-.075 -.003l-.126 -.017l-.111 -.03l-.111 -.044l-.098 -.052l-.096 -.067l-.09 -.08l-3 -3a1 1 0 0 1 1.414 -1.414l1.293 1.293v-9.586a1 1 0 0 1 1 -1" />
                                </svg>
                              )}
                            </span>
                          ) : (
                            <span class="sort-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M11.293 3.293a1 1 0 0 1 1.414 0l6 6a.95 .95 0 0 1 .073 .082l.006 .008l.016 .022l.042 .059l.009 .015l.007 .01l.014 .027l.024 .044l.007 .017l.01 .02l.012 .032l.015 .034l.007 .025l.008 .02l.005 .026l.012 .037l.004 .028l.006 .025l.003 .026l.006 .033l.002 .03l.003 .028v.026l.002 .033l-.002 .033v.026l-.003 .026l-.002 .032l-.005 .029l-.004 .03l-.006 .024l-.004 .03l-.012 .035l-.005 .027l-.008 .019l-.007 .026l-.015 .033l-.012 .034l-.01 .018l-.007 .018l-.024 .043l-.014 .028l-.007 .009l-.009 .016l-.042 .058l-.012 .019l-.004 .003l-.006 .01a1.006 1.006 0 0 1 -.155 .154l-.009 .006l-.022 .016l-.058 .042l-.016 .009l-.009 .007l-.028 .014l-.043 .024l-.018 .007l-.018 .01l-.034 .012l-.033 .015l-.024 .006l-.021 .009l-.027 .005l-.036 .012l-.029 .004l-.024 .006l-.028 .003l-.031 .006l-.032 .002l-.026 .003h-.026l-.033 .002h-12c-.89 0 -1.337 -1.077 -.707 -1.707l6 -6z" />
                                <path d="M18 13l.033 .002h.026l.026 .003l.032 .002l.031 .006l.028 .003l.024 .006l.03 .004l.035 .012l.027 .005l.019 .008l.026 .007l.033 .015l.034 .012l.018 .01l.018 .007l.043 .024l.028 .014l.009 .007l.016 .009l.051 .037l.026 .017l.003 .004l.01 .006a.982 .982 0 0 1 .154 .155l.006 .009l.015 .02l.043 .06l.009 .016l.007 .009l.014 .028l.024 .043l.005 .013l.012 .023l.012 .034l.015 .033l.007 .026l.008 .02l.005 .026l.012 .036l.004 .029l.006 .024l.003 .028l.006 .031l.002 .032l.003 .026v.026l.002 .033l-.002 .033v.026l-.003 .026l-.002 .032l-.006 .031l-.003 .028l-.006 .024l-.004 .03l-.012 .035l-.005 .027l-.008 .019l-.007 .026l-.015 .033l-.012 .034l-.01 .018l-.007 .018l-.024 .043l-.014 .028l-.007 .009l-.009 .016l-.042 .058l-.012 .019l-.004 .003l-.006 .01l-.073 .081l-6 6a1 1 0 0 1 -1.414 0l-6 -6c-.63 -.63 -.184 -1.707 .707 -1.707h12z" />
                              </svg>
                            </span>
                          ))}
                        {header.label}
                      </span>
                      {header.filterable && (
                        <Fragment>
                          {/* <label class="sr-only" htmlFor="column-filter">{`${this.config.filter} ${header}`}</label>
                          <input
                            id="column-filter"
                            type="text"
                            placeholder={`${this.config.filter} ${header.key}`}
                            value={this.columnFilters[header.key]}
                            onChange={event => this.handleColumnFilterChange(header.key, event)}
                          /> */}
                          <bt-column-search type={header.type} onFilterChange={(event: CustomEvent) => this.handleColumnFilterChange(header.key, event)}></bt-column-search>
                        </Fragment>
                      )}
                    </div>
                  </th>
                ))}
                {Object.keys(this.actions).length > 0 && (
                  <th style={{ width: '0' }}>
                    <span>{this.config.actions}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {this.paginatedRows.map((row, i, arr) => (
                <tr data-id={row.id}>
                  <td class="selectioncell" headers={this.config.select}>
                    <label class="sr-only" htmlFor={row.id}>
                      {this.config.select}
                    </label>
                    <input id={row.id} class="selection-checkbox" type="checkbox" checked={this.selectedRows.has(row.id)} onChange={() => this.handleRowSelection(row.id)} />
                  </td>
                  {this.headers.map(header => (
                    <td
                      key={header.key}
                      headers={header.key}
                      data-label={header.label}
                      class={header.cellClasses && header.cellClasses(row[header.key])}
                      contentEditable={header.editable}
                      onBlur={event => this.handleCellEdit(row, header.key, event)}
                      innerHTML={row[header.key] ? row[header.key] : '-'}
                    ></td>
                  ))}
                  {Object.keys(this.actions).length > 0 && (
                    <td class="actionscell" headers={this.config.actions}>
                      <bt-dropdown options={this.actions} x="right" y={i === arr.length - 1 ? 'top' : 'bottom'}></bt-dropdown>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {this.internalTotalRows > this.paginationSize && this.renderPagination()}
        <slot></slot>
      </section>
    );
  }
}
