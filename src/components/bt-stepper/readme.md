# bt-stepper



<!-- Auto Generated Below -->


## Events

| Event        | Description | Type                  |
| ------------ | ----------- | --------------------- |
| `step`       |             | `CustomEvent<number>` |
| `stepperEnd` |             | `CustomEvent<void>`   |


## Methods

### `setStep(index: number) => Promise<void>`



#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `index` | `number` |             |

#### Returns

Type: `Promise<void>`



### `setStepValidity(index: number, isValid: boolean) => Promise<void>`



#### Parameters

| Name      | Type      | Description |
| --------- | --------- | ----------- |
| `index`   | `number`  |             |
| `isValid` | `boolean` |             |

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [bt-button](../bt-button)

### Graph
```mermaid
graph TD;
  bt-stepper --> bt-button
  style bt-stepper fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
