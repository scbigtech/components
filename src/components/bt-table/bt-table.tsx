import { Component, Event, EventEmitter, Fragment, Method, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'bt-table',
  styleUrl: 'bt-table.scss',
  shadow: true,
})
export class BtTable {
  @Prop() headers: { key: string; label: string; sortable?: boolean; filterable?: boolean; action?: boolean }[] = [];
  @Prop() rows: { [key: string]: any }[] = [];
  @Prop() actions: { [key: string]: (row: { [key: string]: any; }) => void } = {};
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
    actions: 'Actions'
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
  @Event({ eventName: 'action' }) onCellAction: EventEmitter<{ row: { [key: string]: any }, action: string }>;
  @Event({ eventName: 'edit' }) cellEdit: EventEmitter<{ row: { [key: string]: any } }>;

  /**
   * Called when the rows array changes. Updates the filtered rows and clears the selected rows.
   * @private
   */
  @Watch('rows')
  onRowsChange() {
    this.updateRows();
  }

  /**
   * Returns a promise that resolves to an array of all rows that are currently selected.
   * The promise resolves to an array of objects, where each object is a row in the table.
   * @returns A promise that resolves to an array of all selected rows.
   * @example
   * const btTable = document.querySelector('bt-table');
   * const selectedRows = await btTable.getAllSelectedRows();
   */
  @Method()
  async getAllSelectedRows() {
    return this.rows.filter(row => this.selectedRows.has(row.id));
  }

  /**
   * Applies filters and sorting to the rows data based on the current search text,
   * column-specific filters, and sort configuration, but only if the table is in
   * async mode. If the table is not in async mode, it does nothing.
   * @returns A promise that resolves to the filtered rows.
   * @example
   * const btTable = document.querySelector('bt-table');
   * await btTable.applyAsyncSearch();
   */
  @Method()
  async applyAsyncSearch() {
    if (this.isAsync) this.applyFilters();
    else {
      console.warn("The 'applyAsyncSearch' method can only be called when the 'isAsync' property is set to true.");
      return null;
    }
  }

  /**
   * Emits the 'action' event when a cell action button is clicked.
   * If a handler for the action is specified in the 'actions' property,
   * it will be called with the row object as the only argument.
   * @param row The row object where the cell action was triggered.
   * @param action The action that was triggered.
   * @private
   */
  private emitCellAction(row: { [key: string]: any }, action: any) {
    if (this.actions[action]["handler"]) {
      this.actions[action]["handler"](row);
      this.onCellAction.emit({ row, action });
    } else {
      console.warn(`No handler found for action: ${action}`);
    }

  }

  componentWillLoad() {
    this.initializeFilters();
  }

  /**
   * Updates the filteredRows array based on the current state of the table's
   * properties (rows, totalRows, etc.).
   * If the rows property is invalid, it will log an error to the console and
   * reset the filteredRows array to an empty array.
   * @private
   */
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

  /**
   * Checks if the rows array is valid and contains all the keys defined in the headers array.
   * If the rows array is invalid, it logs an error to the console and returns false.
   * If the rows array is valid, it returns true.
   * @private
   */
  private validateRows(): boolean {
    if (!this.rows || !Array.isArray(this.rows)) {
      console.warn('rows is invalid or not set:', this.rows);
      return false
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
  /**
   * Initializes the columnFilters property by iterating over the headers array and
   * adding an empty string to the columnFilters object for each header that has
   * filterable set to true.
   * @private
   */
  private initializeFilters() {
    const filters: { [key: string]: string } = {};
    this.headers.forEach(header => {
      if (header.filterable) filters[header.key] = '';
    });
    this.columnFilters = filters;
  }

  /**
   * Handles the search input change event by updating the searchText property,
   * applying filters if the table is not in async mode, and emitting a search event.
   * @param event - The search input change event.
   * @private
   */
  private handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.toLowerCase();
    if (!this.isAsync) this.applyFilters();
    this.search.emit({ searchText: this.searchText });
  }

  /**
   * Handles the sort event by updating the sortConfig property and emitting a sort event.
   * If the table is not in async mode, it also applies filters.
   * @param header - The key of the header that triggered the sort event.
   * @private
   */
  private handleSort(header: string) {
    if (!this.headers.find(h => h.key === header && h.sortable)) return;

    const direction = this.sortConfig.key === header && this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    this.sortConfig = { key: header, direction };
    this.applyFilters();
    this.sort.emit(this.sortConfig);
  }

/**
 * Handles the change event for column-specific filters.
 *
 * This function updates the columnFilters object with the new filter value
 * for the specified header, applies the updated filters to the rows, and
 * emits a filter event with the current columnFilters state.
 *
 * @param header - The key of the column being filtered.
 * @param event - The event triggered by the change in the filter input.
 * @private
 */
  private handleColumnFilterChange(header: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.columnFilters = { ...this.columnFilters, [header]: input.value.toLowerCase() };
    this.applyFilters();
    this.filter.emit({ filters: this.columnFilters });
  }

  /**
   * Applies filters to the rows based on the current state of the table's properties (searchText, columnFilters, sortConfig).
   * If the table is in async mode, it does nothing.
   * It emits a pagination event with the current page set to 1 after applying filters.
   * @private
   */
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
    this.currentPage = 1; // Reset to the first page after applying filters
  }

  /**
   * Handles the selection of a single row by adding or removing it from the set of
   * selected rows and emitting a rowSelect event with the selected row.
   * @param id - The id of the row that was selected or deselected.
   * @private
   */
  private async handleRowSelection(id: string) {
    const selected = new Set(this.selectedRows);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedRows = selected;

    const selectedRow = this.rows.find(row => row.id === id);
    this.rowSelect.emit({selectedRow, selectedRows: await this.getAllSelectedRows()});
  }

  /**
   * Handles the selection of all rows by either selecting all visible rows or
   * deselecting all visible rows, depending on the current state of the table.
   *
   * If all visible rows are currently selected, it will deselect all visible rows.
   * If not all visible rows are currently selected, it will select all visible rows.
   *
   * It emits a rowSelect event with an array of all selected rows after handling
   * the selection of all rows.
   * @private
   */
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

/**
 * Checks if all visible rows are selected.
 *
 * This method first checks if there are any filtered rows; if there are none, it returns false.
 * Otherwise, it maps the IDs of the currently paginated rows and checks if each ID is 
 * present in the set of selected rows.
 *
 * @returns {boolean} True if all visible rows are selected, otherwise false.
 */
  private isAllSelected() {
    if (this.filteredRows.length === 0) return false;
    const visibleRows = this.paginatedRows.map(row => row.id);
    return visibleRows.every(id => this.selectedRows.has(id));
  }

  /**
   * Handles the page change event by updating the `currentPage` property
   * and emitting a `pagination` event with the new page number and the
   * current `pageSize` value.
   *
   * @param newPage - The new page number.
   * @private
   */
  private handlePageChange(newPage: number) {
    //Si no es +1 se muestra la tabla vacia porque se llena la pagina anterior pero no la seleccionada
    // revisar con get paginatedrows
    this.currentPage = newPage;
    this.pagination.emit({ page: newPage, pageSize: this.pageSize });
  }

  /**
   * Returns a slice of the filtered rows, representing the current page
   * of data. The start index is calculated by subtracting 1 from the current
   * page number and multiplying by the page size. The end index is the minimum
   * of the start index plus the page size minus 1, and the total count of
   * rows, minus 1.
   *
   * @returns {Array<{[key: string]: any}>} A slice of the filtered rows.
   * @private
   */
  private get paginatedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min((start + 1) + this.pageSize - 1, this.internalTotalRows);
    return this.filteredRows.slice(start, end);
  }

/**
 * Renders the pagination controls for the table.
 *
 * Calculates the total number of pages based on the total number of rows
 * and the current page size. Displays the current range of rows being viewed,
 * and provides buttons to navigate between pages.
 *
 * The pagination buttons include controls for navigating to the previous
 * and next pages, as well as direct access to up to three pages at a time.
 * The buttons are disabled when on the first or last page, respectively.
 * The current page is highlighted among the page buttons.
 *
 * @private
 */
  private renderPagination() {
    const totalPages = Math.ceil(this.internalTotalRows / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this.internalTotalRows);
    return (
      <footer class="pagination">
        <div class="pagination-info">
          <span>{this.config.page} {start} - {end} ({this.internalTotalRows} {this.config.rows})</span>
        </div>
        <div class="pagination-buttons">
          <bt-button hideText={true} disabled={this.currentPage === 1} onClick={() => this.handlePageChange(this.currentPage - 1)}>
            <svg slot="icon-left" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg>
            <span>{this.config.prev}</span>
          </bt-button>
          {this.filteredRows.length > 0 && totalPages > 1 && (() => {
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

            return pages.map((page) => (
              <bt-button
                class={this.currentPage === page ? 'active' : ''}
                onClick={() => this.handlePageChange(page)}
              >
                {page}
              </bt-button>
            ));
          })()}
          <bt-button hideText={true} disabled={this.currentPage === totalPages} onClick={() => this.handlePageChange(this.currentPage + 1)}>
            <span>{this.config.next}</span>
            <svg slot="icon-right" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg>
          </bt-button>
        </div>
      </footer>
    );
  }

  /**
   * Handles the page size change event.
   *
   * When the page size is changed, this function is called. It
   * updates the component's `pageSize` property and resets the
   * `currentPage` to 1. It also emits a `pageSizeChange` event
   * with the new page size.
   *
   * @param event The page size change event.
   */
  private handlePageSizeChange(event: Event) {
    const input = event.target as HTMLSelectElement;
    this.paginationSize = parseInt(input.value, 10);
    this.currentPage = 1;
    this.pageSizeChange.emit({ pageSize: this.paginationSize });
  }


  /**
   * Handles the cell edit event.
   *
   * When the user edits a cell, this function is called. It updates
   * the corresponding row object with the new value and emits a
   * `cellEdit` event with the updated row object.
   *
   * @param row The row object being edited.
   * @param header The header key of the cell being edited.
   * @param event The cell edit event.
   */
  private handleCellEdit(row: { [key: string]: any; }, header: string, event: Event) {
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
            <img src='/assets/img/empty-data.svg' alt="no data" width={300} height={300} />
          </div>
        </section>
      );
    }
    if (this.isAsync && this.rows.length === 0) {
      return <p>{this.config.loading}</p>;
    }
    return (
      <section class="table-container">
        <h2 part='heading-1'>{this.config.caption}</h2>
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
              <option value="" disabled selected>{this.paginationSize}</option>
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
                  <label class="sr-only" htmlFor="select-all">{this.config.selectall}</label>
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
                            id='column-filter'
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
                {Object.keys(this.actions).length > 0 && <th style={{ width: '0' }}>
                  <span>{this.config.actions}</span>
                </th>}
              </tr>
            </thead>
            <tbody>
              {this.paginatedRows.map(row => (
                <tr>
                  <td>
                    <label class="sr-only">{this.config.select}</label>
                    <input
                      class="selection-checkbox"
                      type="checkbox"
                      checked={this.selectedRows.has(row.id)}
                      onChange={() => this.handleRowSelection(row.id)}
                    />
                  </td>
                  {this.headers.map(header =>
                    <td contentEditable onBlur={event => this.handleCellEdit(row, header.key, event)} innerHTML={row[header.key] ? row[header.key] : '-'}></td>,
                  )}
                  {Object.keys(this.actions).length > 0 && <td>
                    <div class="actions">
                      {Object.keys(this.actions).map(action => (
                        <bt-button
                          hideText={true}
                          class={`${this.actions[action]["class"]}`}
                          onClick={() => this.emitCellAction(row, action)}>
                          {this.actions[action]["label"] || action}
                          <span slot='icon-right' innerHTML={this.actions[action]["icon"]}></span>
                        </bt-button>))}
                    </div>
                  </td>}
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
