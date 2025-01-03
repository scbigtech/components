# bt-table



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description                                                                | Type                                                                                                                                                                                                                              | Default                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`   | --           |                                                                            | `{ [key: string]: (row: { [key: string]: any; }) => void; }`                                                                                                                                                                      | `{}`                                                                                                                                                                                                                                                                                                                                                            |
| `config`    | --           |                                                                            | `{ [key: string]: any; }`                                                                                                                                                                                                         | `{     caption: 'Data table',     next: 'Next',     prev: 'Previous',     emptyData: 'No data',     loading: 'Loading...',     error: 'Error',     pagesize: 'Rows per page',     page: 'Page',     rows: 'Rows',     select: 'Select',     selectall: 'Select all',     search: 'Search',     sort: 'Sort',     filter: 'Filter',     actions: 'Actions',   }` |
| `headers`   | --           |                                                                            | `{ key: string; label: string; class: string; type: "string" \| "number" \| "html"; cellClasses?: (cell: { [key: string]: any; }) => string; sortable?: boolean; filterable?: boolean; editable?: boolean; action?: boolean; }[]` | `[]`                                                                                                                                                                                                                                                                                                                                                            |
| `isAsync`   | `is-async`   | Flag to indicate if the table has async data handles search and pagination | `boolean`                                                                                                                                                                                                                         | `false`                                                                                                                                                                                                                                                                                                                                                         |
| `pageSize`  | `page-size`  |                                                                            | `number`                                                                                                                                                                                                                          | `5`                                                                                                                                                                                                                                                                                                                                                             |
| `rows`      | --           |                                                                            | `{ [key: string]: any; }[]`                                                                                                                                                                                                       | `[]`                                                                                                                                                                                                                                                                                                                                                            |
| `totalRows` | `total-rows` |                                                                            | `number`                                                                                                                                                                                                                          | `undefined`                                                                                                                                                                                                                                                                                                                                                     |


## Events

| Event         | Description | Type                                                             |
| ------------- | ----------- | ---------------------------------------------------------------- |
| `cell-action` |             | `CustomEvent<{ rowId: string; action: string; }>`                |
| `edit`        |             | `CustomEvent<{ header: string; row: { [key: string]: any; }; }>` |
| `filter`      |             | `CustomEvent<{ filters: { [key: string]: string; }; }>`          |
| `page-size`   |             | `CustomEvent<{ [key: string]: any; }>`                           |
| `pagination`  |             | `CustomEvent<{ [key: string]: any; }>`                           |
| `search`      |             | `CustomEvent<{ searchText: string; }>`                           |
| `selection`   |             | `CustomEvent<{ [key: string]: any; }>`                           |
| `sort`        |             | `CustomEvent<{ key: string; direction: "desc" \| "asc"; }>`      |


## Methods

### `applyAsyncSearch() => Promise<void>`

Applies the filters to the table when the 'isAsync' property is set to true.
If the 'isAsync' property is set to false, a warning is logged to the console.

#### Returns

Type: `Promise<void>`



### `getAllFilteredRows() => Promise<{ [key: string]: any; }[]>`



#### Returns

Type: `Promise<{ [key: string]: any; }[]>`



### `getAllSelectedRows() => Promise<{ [key: string]: any; }[]>`

Returns all selected rows.

#### Returns

Type: `Promise<{ [key: string]: any; }[]>`



### `resetTable() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Shadow Parts

| Part          | Description |
| ------------- | ----------- |
| `"heading-1"` |             |


## Dependencies

### Depends on

- [bt-button](../bt-button)
- [bt-column-search](../bt-column-search)
- [bt-dropdown](../bt-dropdown)

### Graph
```mermaid
graph TD;
  bt-table --> bt-button
  bt-table --> bt-column-search
  bt-table --> bt-dropdown
  bt-dropdown --> bt-button
  style bt-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
