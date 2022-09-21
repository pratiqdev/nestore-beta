
<!-- ![link-text](./public/nestore-logo-3.png) -->
<div style='width: 100%; display: flex; flex-direction: column; align-items: center'>

<div style='background: #ccc; height: 15rem; width: 15rem; border-radius: 50%; margin-bottom:2rem'>
    <img src='public/nestore-logo.png' style='max-height:15rem; margin: 0 50%; transform: translateX(-50%)'>
</div>

<h1 style='color: #55e; font-weight: bold; font-family: Courier; letter-spacing: .2rem'>{{package_title}}</h1>

<div style='width: 100%; display: flex; justify-content: center'>
<div style='margin: 1rem'>

![badge](https://img.shields.io/badge/tests-{{test_status}}-limegreen)

</div>
<div style='margin: 1rem'>

![badge](https://img.shields.io/badge/version-{{package_version}}-color)

</div>
<div style='margin: 1rem'>

[![](https://img.shields.io/badge/license-{{package_license}}-blue)](https://choosealicense.com/licenses/{{package-license}}/)

</div>
<div style='margin: 1rem'>

![badge](https://img.shields.io/badge/Made_with_<3-red)

</div>
</div>
</div>




Fugiat sunt magna sit incididunt quis officia cillum cupidatat. Commodo enim aute ut consectetur. Irure ipsum voluptate adipisicing eu. Occaecat tempor commodo magna dolore cillum ipsum consectetur adipisicing. Aute eiusmod nisi occaecat Lorem ex anim ut laboris ad quis eiusmod excepteur. Aliquip cillum esse id ullamco proident sint voluptate irure duis irure.

---




## Installation

Install using a package manager like npm or yarn:

```bash
yarn add {{package_name}}
```

```bash
npm install {{package_name}}
```

---
## Usage

The {{package_name}} provides a default export that can be used to create a store.

```ts
import {{package_name}} from '{{package_name}}'

const myStore = {{package_name}}({ hello: 'World!' })
```

---


## Interfaces

```ts
export type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
}
```

| Key | Type | Default | Description |
|:----|:-----|:--------|:------------|
`delimiter` | `string` | `"."` | The character used to separate wildcards or nested store properties
`wildcard`  | `boolean`| `true`  | Set to false to disable the usage of wildcards on event listeners
`mutable`  | `boolean`| `false`  | Set to true to allow direct modification of the store without triggering events, and return the store by ref. Default of false will always return a deep clone of the store.
`verbose`  | `boolean`| `true`  | Error messages will contain the event name of the listener that threw the error 
`maxListeners`  | `number`| `10`  | Maximum number of registered listeners before memory leak error is thrown



```ts
export type T_EmitStruct = {
    path: string;
    key: string;
    value?: any;
}
```

| Key | Type | Default | Description |
|:----|:-----|:--------|:------------|
`path` | `string` | `"/"` | A full, normalized path to the nested obect in the store using the provided delimiter.
`key` | `string` | `""` | The key used to access the store value, appears as the last segment of `path`
`value` | `any` | `undefined` | The current value of this `key` @ `path` after the store was updated





---

## Contributing

[](https://github.com/pratiqdev/)

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

Repo: 





---
## License

{{package_license}}
