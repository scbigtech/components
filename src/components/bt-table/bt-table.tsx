import { Component, Event, EventEmitter, Method, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'bt-table',
  styleUrl: 'bt-table.css',
  shadow: true,
})
export class BtTable {
  @Prop() headers: { key: string; label: string; sortable?: boolean; filterable?: boolean; action?: boolean }[] = [];
  @Prop() rows: { [key: string]: any }[] = [];
  @Prop() pageSize: number = 5;
  @Prop() totalRows?: number;
  @Prop() config: { [key: string]: any } = {
    next: { label: 'Next', },
    prev: { label: 'Previous', }
  };

  @State() filteredRows: { [key: string]: any }[] = [];
  @State() searchText: string = '';
  @State() sortConfig: { key: string; direction: 'asc' | 'desc' } = { key: '', direction: 'asc' };
  @State() currentPage: number = 1;
  @State() columnFilters: { [key: string]: string } = {};
  @State() selectedRows: Set<number> = new Set();
  @State() totalPages: number = 1;
  @State() _totalRows: number = 0;

  @Event({ eventName: 'selection' }) rowSelect: EventEmitter<{ [key: string]: any }>;
  @Event() pagination: EventEmitter<{ [key: string]: any }>;
  @Event() sort: EventEmitter<{ key: string; direction: 'asc' | 'desc' }>;
  @Event() filter: EventEmitter<{ filters: { [key: string]: string } }>;

  /**
   * Watches for changes to the rows property and updates the filtered rows.
   * If the rows property is invalid, it will log an error to the console.
   * @private
   */
  @Watch('rows')
  onRowsChange() {
    this.updateRows();
  }

  /**
  * Sets the cell action handler function.
  * This function is called when a cell in the table is clicked.
  * It is passed the row object and column key as arguments.
  * @param handler The function to be called when a cell is clicked.
  */
  @Method()
  async onCellAction(handler: (row: { [key: string]: any }, key: string) => void) {
    this.cellActionHandler = handler;
  }


  /**
  * Returns a promise that resolves to an array of all rows that are currently selected.
  * @returns A promise that resolves to an array of all selected rows.
  */
  @Method()
  async getAllSelectedRows() {
    return this.rows.filter((_, index) => this.selectedRows.has(index));
  }

  private cellActionHandler: (row: { [key: string]: any }, key: string) => void;
  /**
 * Calls the cellActionHandler function (if defined) with the row object and column key as arguments.
 * This function is called internally by the table when a cell is clicked.
 * @param row The row object containing the cell that was clicked.
 * @param key The key of the column in which the cell was clicked.
 */
  emitCellAction(row: { [key: string]: any }, key: string) {
    if (this.cellActionHandler) {
      this.cellActionHandler(row, key);
    }
  }
  componentWillLoad() {
    this.initializeFilters();
  }

  /**
   * Updates the filteredRows state by cloning the rows property.
   * If the rows property is invalid, it will log an error to the console
   * and do nothing.
   * @private
   */
  private updateRows() {

    if (!this.validateRows()) {
      console.error('Invalid rows. Each row must match the keys defined in headers.');
      return;
    }
    if (this.totalRows === undefined) {
      this._totalRows = this.rows.length;
    } else {
      this._totalRows = this.totalRows;
    }
    this.filteredRows = [...this.rows];
  }

  /**
   * Validates the rows property and returns a boolean indicating whether
   * it is valid.
   *
   * A valid rows property is an array of objects, where each object has
   * all the keys defined in the headers property. If a key is missing,
   * it will be assigned a default value of undefined.
   *
   * @returns {boolean} True if the rows property is valid, false otherwise.
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
   * Initializes the column filters based on the headers configuration.
   *
   * This function iterates over the table headers and creates an initial
   * filter object for each header that is marked as filterable. The filter
   * object is stored in the `columnFilters` state, with each key representing
   * the header key and the value initialized to an empty string.
   */
  initializeFilters() {
    const filters: { [key: string]: string } = {};
    this.headers.forEach(header => {
      if (header.filterable) filters[header.key] = '';
    });
    this.columnFilters = filters;
  }

  /**
   * Handles the search input event to filter table rows.
   *
   * This function is triggered when the search input value changes.
   * It updates the `searchText` state with the lowercase value of the input,
   * then applies the current filters to update the displayed rows.
   *
   * @param event The input event from the search field.
   */
  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.toLowerCase();
    this.applyFilters();
  }

  /**
   * Sorts the table rows based on the specified column header.
   *
   * This function checks if the specified header is sortable. If it is,
   * it toggles the sort direction between ascending ('asc') and descending ('desc')
   * based on the current sort configuration. It then updates the sort configuration
   * and reapplies the filters to sort the displayed rows.
   *
   * @param header The key of the column to sort by.
   */
  handleSort(header: string) {
    if (!this.headers.find(h => h.key === header && h.sortable)) return;

    const direction = this.sortConfig.key === header && this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    this.sortConfig = { key: header, direction };
    this.applyFilters();
    this.sort.emit(this.sortConfig);
  }

  /**
   * Updates the column filter for a specified header and applies the filters.
   *
   * This function is triggered when a filter input changes for a specific column.
   * It updates the `columnFilters` state with the new filter value for the specified
   * header and then applies all current filters to update the displayed rows.
   *
   * @param header The key of the column to apply the filter to.
   * @param event The input change event containing the new filter value.
   */
  handleColumnFilterChange(header: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.columnFilters = { ...this.columnFilters, [header]: input.value.toLowerCase() };
    this.applyFilters();
    this.filter.emit({ filters: this.columnFilters });
  }

  /**
   * Applies filters and sorting to the rows data based on the current search text,
   * column-specific filters, and sort configuration. Updates the filteredRows state
   * and resets the current page to the first page after applying filters.
   */
  applyFilters() {
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
   * Handles row selection, either adding or removing the row from the selectedRows set, and emits the rowSelect event.
   * @param index The index of the row to select or deselect.
   */
  handleRowSelection(index: number) {
    const selected = new Set(this.selectedRows);
    if (selected.has(index)) {
      selected.delete(index);
    } else {
      selected.add(index);
    }
    this.selectedRows = selected;

    this.rowSelect.emit({ row: this.rows[index], index });
  }

  /**
   * Selects or deselects all visible rows in the current page.
   * If all visible rows are already selected, it will deselect them.
   * If not all visible rows are selected, it will select them all.
   */
  handleSelectAll() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const visibleRows = this.filteredRows.slice(start, end);

    const selected = new Set(this.selectedRows);
    if (this.isAllSelected()) {
      // Si ya están todas seleccionadas, eliminarlas
      visibleRows.forEach((_, index) => selected.delete(start + index));
    } else {
      // Agregar todas las visibles
      visibleRows.forEach((_, index) => selected.add(start + index));
    }
    this.selectedRows = selected;

    this.rowSelect.emit({ selectedRows: this.selectedRows });
  }

  /**
   * Returns true if all visible rows in the current page are selected.
   * @returns Whether all visible rows are selected.
   */
  isAllSelected() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const visibleRows = this.filteredRows.slice(start, end);
    return visibleRows.every((_, index) => this.selectedRows.has(start + index));
  }

  /**
 * Updates the current page of the table to the given page number and emits a
 * pagination event with the new page number.
 * @param newPage The new page number
 */
  handlePageChange(newPage: number) {
    this.currentPage = newPage;
    this.pagination.emit({ page: newPage, pageSize: this.pageSize });
  }

  /**
   * Returns a subset of the filtered rows, limited to the current page.
   * The subset is determined by the current page and the page size.
   * @returns An array of rows to be displayed in the current page.
   */
  get paginatedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    //Al estar sobreescribiendo this.rows en lugar de agregalos no obtengo el start y end de la paginacion. Siempre son 0 - page.size...
    //Para data estatica funciona correctamente pero para data dinamica no
    return this.filteredRows.slice(start, end);
  }

  /**
   * Renders the pagination buttons for the table.
   * The buttons are conditionally enabled/disabled based on the current page.
   * The buttons are also given an active class if they match the current page.
   * @returns A JSX Element representing the pagination buttons.
   */
  renderPagination() {
    const totalPages = Math.ceil(this._totalRows / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, this._totalRows);
    return (
      <footer class="pagination">
        <div class="pagination-info">
          <span>Mostrando {start} - {end} de {this._totalRows} filas</span>
        </div>
        <div class="pagination-buttons">
          <bt-button disabled={this.currentPage === 1} onClick={() => this.handlePageChange(this.currentPage - 1)}>
            <svg slot="icon-left" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg>
            <span>{this.config.prev.label}</span>
          </bt-button>
          {this.filteredRows.length > 0 && [...Array(totalPages)]
            .map((_, i) => i + 1)
            .slice(
              Math.max(this.currentPage - 2, 0),
              Math.min(this.currentPage + 1, totalPages)
            )
            .map((page) => (
              <bt-button
                class={this.currentPage === page ? 'active' : ''}
                onClick={() => this.handlePageChange(page)}
              >
                {page}
              </bt-button>
            ))}
          <bt-button disabled={this.currentPage === totalPages} onClick={() => this.handlePageChange(this.currentPage + 1)}>
            <span>{this.config.next.label}</span>
            <svg slot="icon-right" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg>
          </bt-button>
        </div>
      </footer>
    );
  }

  /**
 * Handles changes in the rows per page selector, updates the page size,
 * and resets the current page to the first page.
 * @param event The input event from the rows per page selector.
 */
  handlePageSizeChange(event: Event) {
    const input = event.target as HTMLSelectElement;
    this.pageSize = parseInt(input.value, 10);
    this.currentPage = 1;
  }

  render() {
    return (
      <section class="table-container">
        {/* Search */}
        <header class="toolbar">
          <search class="search-container">
            <div>
              <input type="text" placeholder="Search..." value={this.searchText} onInput={this.handleSearch.bind(this)} />
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
            <span>Page Size</span>
            <select onInput={this.handlePageSizeChange.bind(this)}>
              <option value="" disabled>{this.pageSize}</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
        </header>

        {/* Table */}
        <table>
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={this.isAllSelected()} onChange={() => this.handleSelectAll()} />
              </th>
              {this.headers.map(header => (
                <th>
                  <div>
                    <span onClick={() => this.handleSort(header.key)}>
                      {header.label}
                      {this.sortConfig.key === header.key && <span>{this.sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>}
                    </span>
                    {header.filterable && (
                      <input
                        type="text"
                        placeholder={`Filter ${header.label}`}
                        value={this.columnFilters[header.key]}
                        onInput={event => this.handleColumnFilterChange(header.key, event)}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {this.paginatedRows.map((row, index) => (
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={this.selectedRows.has((this.currentPage - 1) * this.pageSize + index)}
                    onChange={() => this.handleRowSelection((this.currentPage - 1) * this.pageSize + index)}
                  />
                </td>
                {this.headers.map(header =>
                  header.action ? <td onClick={() => this.emitCellAction(row, header.key)} innerHTML={row[header.key]}></td> : <td innerHTML={row[header.key]}></td>,
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {this.renderPagination()}
      </section>
    );
  }
}
