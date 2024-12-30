# bt-table



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute    | Description                                                                | Type                                                                                                                                                                                        | Default                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`   | --           |                                                                            | `{ [key: string]: (row: { [key: string]: any; }) => void; }`                                                                                                                                | `{}`                                                                                                                                                                                                                                                                                                                                                            |
| `config`    | --           |                                                                            | `{ [key: string]: any; }`                                                                                                                                                                   | `{     caption: 'Data table',     next: 'Next',     prev: 'Previous',     emptyData: 'No data',     loading: 'Loading...',     error: 'Error',     pagesize: 'Rows per page',     page: 'Page',     rows: 'Rows',     select: 'Select',     selectall: 'Select all',     search: 'Search',     sort: 'Sort',     filter: 'Filter',     actions: 'Actions',   }` |
| `headers`   | --           |                                                                            | `{ key: string; label: string; class: string; cellClasses?: (cell: { [key: string]: any; }) => string; sortable?: boolean; filterable?: boolean; editable?: boolean; action?: boolean; }[]` | `[]`                                                                                                                                                                                                                                                                                                                                                            |
| `isAsync`   | `is-async`   | Flag to indicate if the table has async data handles search and pagination | `boolean`                                                                                                                                                                                   | `false`                                                                                                                                                                                                                                                                                                                                                         |
| `pageSize`  | `page-size`  |                                                                            | `number`                                                                                                                                                                                    | `5`                                                                                                                                                                                                                                                                                                                                                             |
| `rows`      | --           |                                                                            | `{ [key: string]: any; }[]`                                                                                                                                                                 | `[]`                                                                                                                                                                                                                                                                                                                                                            |
| `totalRows` | `total-rows` |                                                                            | `number`                                                                                                                                                                                    | `undefined`                                                                                                                                                                                                                                                                                                                                                     |


## Events

| Event        | Description | Type                                                             |
| ------------ | ----------- | ---------------------------------------------------------------- |
| `action`     |             | `CustomEvent<{ row: { [key: string]: any; }; action: string; }>` |
| `edit`       |             | `CustomEvent<{ header: string; row: { [key: string]: any; }; }>` |
| `filter`     |             | `CustomEvent<{ filters: { [key: string]: string; }; }>`          |
| `page-size`  |             | `CustomEvent<{ [key: string]: any; }>`                           |
| `pagination` |             | `CustomEvent<{ [key: string]: any; }>`                           |
| `search`     |             | `CustomEvent<{ searchText: string; }>`                           |
| `selection`  |             | `CustomEvent<{ [key: string]: any; }>`                           |
| `sort`       |             | `CustomEvent<{ key: string; direction: "desc" \| "asc"; }>`      |


## Methods

### `applyAsyncSearch() => Promise<any>`



#### Returns

Type: `Promise<any>`



### `getAllSelectedRows() => Promise<{ [key: string]: any; }[]>`



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

### Graph
```mermaid
graph TD;
  bt-table --> bt-button
  style bt-table fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
