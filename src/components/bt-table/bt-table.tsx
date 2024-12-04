import { Component, Prop, State, Method, h } from '@stencil/core';

@Component({
  tag: 'bt-table',
  styleUrl: 'bt-table.css',
  shadow: true,
})
export class BtTable {
  @Prop() headers: { key: string; label: string; sortable?: boolean; filterable?: boolean; action?: boolean }[] = [];
  @Prop() rows: { [key: string]: any }[] = [];
  @Prop() pageSize: number = 5;

  @State() filteredRows: { [key: string]: any }[] = [];
  @State() searchText: string = '';
  @State() sortConfig: { key: string; direction: 'asc' | 'desc' } = { key: '', direction: 'asc' };
  @State() currentPage: number = 1;
  @State() columnFilters: { [key: string]: string } = {};

  private cellActionHandler: (row: { [key: string]: any }, key: string) => void;

  componentWillLoad() {
    this.filteredRows = [...this.rows];
    this.initializeFilters();
  }

  initializeFilters() {
    const filters: { [key: string]: string } = {};
    this.headers.forEach(header => {
      if (header.filterable) filters[header.key] = '';
    });
    this.columnFilters = filters;
  }

  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.toLowerCase();
    this.applyFilters();
  }

  handleSort(header: string) {
    if (!this.headers.find(h => h.key === header && h.sortable)) return; // No sortable column

    const direction = this.sortConfig.key === header && this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    this.sortConfig = { key: header, direction };
    this.applyFilters();
  }

  handleColumnFilterChange(header: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.columnFilters = { ...this.columnFilters, [header]: input.value.toLowerCase() };
    this.applyFilters();
  }

  applyFilters() {
    let rows = [...this.rows];

    // Filtro global (búsqueda)
    if (this.searchText) {
      rows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(this.searchText));
    }

    // Filtros por columna
    Object.entries(this.columnFilters).forEach(([key, value]) => {
      if (value) {
        rows = rows.filter(row => row[key]?.toLowerCase().includes(value));
      }
    });

    // Ordenar
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
    this.currentPage = 1; // Reiniciar a la primera página tras aplicar filtros
  }

  handlePageChange(newPage: number) {
    this.currentPage = newPage;
  }

  @Method()
  async onCellAction(handler: (row: { [key: string]: any }, key: string) => void) {
    this.cellActionHandler = handler;
  }

  emitCellAction(row: { [key: string]: any }, key: string) {
    if (this.cellActionHandler) {
      this.cellActionHandler(row, key);
    }
  }

  get paginatedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredRows.slice(start, end);
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
    return (
      <div class="pagination">
        <button disabled={this.currentPage === 1} onClick={() => this.handlePageChange(this.currentPage - 1)}>
          Previous
        </button>
        {[...Array(totalPages)].map((_, index) => (
          <button class={this.currentPage === index + 1 ? 'active' : ''} onClick={() => this.handlePageChange(index + 1)}>
            {index + 1}
          </button>
        ))}
        <button disabled={this.currentPage === totalPages} onClick={() => this.handlePageChange(this.currentPage + 1)}>
          Next
        </button>
      </div>
    );
  }

  render() {
    return (
      <div class="table-container">
        {/* Buscador */}
        <div class="search-container">
          <span>
            <input type="text" placeholder="Search..." value={this.searchText} onInput={this.handleSearch.bind(this)} />
            <button>
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
            </button>
          </span>
        </div>

        {/* Tabla */}
        <table>
          <thead>
            <tr>
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
            {this.paginatedRows.map(row => (
              <tr>
                {this.headers.map(header =>
                  header.action ? <td onClick={() => this.emitCellAction(row, header.key)} innerHTML={row[header.key]}></td> : <td innerHTML={row[header.key]}></td>,
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {this.renderPagination()}
      </div>
    );
  }
}
