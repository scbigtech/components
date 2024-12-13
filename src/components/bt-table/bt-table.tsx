import { Component, Event, EventEmitter, Fragment, Method, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'bt-table',
  styleUrl: 'bt-table.scss',
  shadow: true,
})
export class BtTable {
  @Prop() headers: { key: string; label: string; sortable?: boolean; filterable?: boolean; action?: boolean }[] = [];
  @Prop() rows: { [key: string]: any }[] = [];
  @Prop() actions: { [key: string]: (row: { [key: string]: any }) => void } = {};
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

  @State() filteredRows: { [key: string]: any }[] = [];
  @State() searchText: string = '';
  @State() sortConfig: { key: string; direction: 'asc' | 'desc' } = { key: '', direction: 'asc' };
  @State() currentPage: number = 1;
  @State() columnFilters: { [key: string]: string } = {};
  @State() selectedRows: Set<string> = new Set();
  @State() totalPages: number = 1;
  @State() internalTotalRows: number = 0;
  @State() paginationSize: number = this.pageSize;

  @Event() search: EventEmitter<{ searchText: string }>;
  @Event({ eventName: 'selection' }) rowSelect: EventEmitter<{ [key: string]: any }>;
  @Event({ eventName: 'page-size' }) pageSizeChange: EventEmitter<{ [key: string]: any }>;
  @Event() pagination: EventEmitter<{ [key: string]: any }>;
  @Event() sort: EventEmitter<{ key: string; direction: 'asc' | 'desc' }>;
  @Event() filter: EventEmitter<{ filters: { [key: string]: string } }>;
  @Event({ eventName: 'action' }) onCellAction: EventEmitter<{ row: { [key: string]: any }; action: string }>;
  @Event({ eventName: 'edit' }) cellEdit: EventEmitter<{ row: { [key: string]: any } }>;

  @Watch('rows')
  onRowsChange() {
    this.updateRows();
  }

  @Method()
  async getAllSelectedRows() {
    return this.rows.filter(row => this.selectedRows.has(row.id));
  }

  @Method()
  async applyAsyncSearch() {
    if (this.isAsync) this.applyFilters();
    else {
      console.warn("The 'applyAsyncSearch' method can only be called when the 'isAsync' property is set to true.");
      return null;
    }
  }

  private emitCellAction(row: { [key: string]: any }, action: any) {
    if (this.actions[action]['handler']) {
      this.actions[action]['handler'](row);
      this.onCellAction.emit({ row, action });
    } else {
      console.warn(`No handler found for action: ${action}`);
    }
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
  }

  private validateRows(): boolean {
    if (!this.rows || !Array.isArray(this.rows)) {
      console.warn('rows is invalid or not set:', this.rows);
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

    const direction = this.sortConfig.key === header && this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    this.sortConfig = { key: header, direction };
    this.applyFilters();
    this.sort.emit(this.sortConfig);
  }

  private handleColumnFilterChange(header: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.columnFilters = { ...this.columnFilters, [header]: input.value.toLowerCase() };
    this.applyFilters();
    this.filter.emit({ filters: this.columnFilters });
  }

  private applyFilters() {
    let rows = [...this.rows];

    // Global search filter
    if (this.searchText) {
      rows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(this.searchText));
    }

    // Column-specific filters
    Object.entries(this.columnFilters).forEach(([key, value]) => {
      if (value) {
        rows = rows.filter(row => row[key]?.toLowerCase().includes(value));
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
    this.cellEdit.emit({ row });
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
                  <th>
                    <div>
                      <span onClick={() => this.handleSort(header.key)}>
                        {header.label}
                        {this.sortConfig.key === header.key && <span>{this.sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>}
                      </span>
                      {header.filterable && (
                        <Fragment>
                          <label class="sr-only" htmlFor="column-filter">{`${this.config.filter} ${header}`}</label>
                          <input
                            id="column-filter"
                            type="text"
                            placeholder={`${this.config.filter} ${header}`}
                            value={this.columnFilters[header.key]}
                            onInput={event => this.handleColumnFilterChange(header.key, event)}
                          />
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
              {this.paginatedRows.map(row => (
                <tr>
                  <td>
                    <label class="sr-only">{this.config.select}</label>
                    <input class="selection-checkbox" type="checkbox" checked={this.selectedRows.has(row.id)} onChange={() => this.handleRowSelection(row.id)} />
                  </td>
                  {this.headers.map(header => (
                    <td contentEditable onBlur={event => this.handleCellEdit(row, header.key, event)} innerHTML={row[header.key] ? row[header.key] : '-'}></td>
                  ))}
                  {Object.keys(this.actions).length > 0 && (
                    <td>
                      <div class="actions">
                        {Object.keys(this.actions).map(action => (
                          <bt-button hideText={true} class={`${this.actions[action]['class']}`} onClick={() => this.emitCellAction(row, action)}>
                            {this.actions[action]['label'] || action}
                            <span slot="icon-right" innerHTML={this.actions[action]['icon']}></span>
                          </bt-button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {this.renderPagination()}
        <slot></slot>
      </section>
    );
  }
}
