![logo-banner](logo.png)

<p align='center'>
<img src='https://img.shields.io/badge/license_MIT-darkblue'>
<img src='https://img.shields.io/badge/npm_1.0.0-darkblue'>
<img src='https://img.shields.io/badge/tests_passing-darkblue'>
</p>
<h4 align='center'>A simple key-value store with a powerful real-time state management api. </h4>
<p align='center'>Access, monitor and update values with events.</p>
<p align='center'>Support for persistent storage with included or custom adapters.</p>
<p align='center'>In-store mutation functions for easy to manage logic.</p>




<br />
<br />

# Installation

Install using a package manager like npm or yarn, or import from a cdn:

```bash
yarn add nestore
```

```html
<script src="https://unpkg.com/nestore"></script>
```











<br />

## Basic Usage

Import nestore and create a store

```ts
import nestore from 'nestore'

const myStore = nestore({ 
    current_time: Date.now(),
    logged_in: false,
    user_name: null,
    setUserName: (nst, [name]) => nst.store.user_name = name
})

export default myStore
```

Use the `get` and `set` methods to interact with the store, or custom in-store functions

```ts
import myStore from './my-store.ts'

myStore.set('current_time', Date.now())
myStore.setUserName('Alice')
```












<br />


## Advanced Usage

Import nestore and create a store

```ts
import nestore from 'nestore'

const myStore = nestore({ 
    current_time: Date.now(),
    logged_in: false,
    user_name: null,
    user_data: null,

    setLoggedIn: (nst, args) => {
        set('logged_in', true)
        set('user_name', args[0])
        nst.getUserData()
    },

    getUserData: async (nst, args) => {
        const { data } = await axios.get(`/api/user-data/${nst.store.user_name}`)
        nst.set('user_data', data)
        return data
    },

    // ...
})

export default myStore
```

In your application, use the `get` and `set` methods to interact with the store, or call custom 
in-store functions

```ts
import myStore from './my-store.ts'

myStore.setLoggedIn('Johnny68')
myStore.set('current_time', Date.now())
```

Then register event listeners on a key to watch for updates and trigger a callback:

```ts
myStore.on('user.**', ({ path, key, value }) => {
    console.log(`Path ${path} was changed to ${value}`)
})
```



<br />
<br />

# Store Events 

Updates to the store emit events containing which path and key was changed, the new value and a timestamp of the event.

> **Nestore extends the EventEmitter2 API**  
> Documentation for all `EE2` methods can be found [here](https://www.npmjs.com/package/eventemitter2)


<br />

## Event Listeners

Register event listeners on a key to watch for updates and trigger a callback. 
The `set` method causes the store to emit an event containing the key, value and path that was updated.

```ts
myStore.on('user.**', ({ path, key, value }) => {
    console.log(`Path ${path} was changed to ${value}`)
})
```





<br />

## Manual Emit

You can also manually emit events to force update a listener. The value provided to the emit method *should* be an object with the type `T_NestoreEmit`, but any values / types provided will be emitted.


```ts
myStore.emit('address', {
    key: 'address',
    path: 'user.location.address',
    value: '1234 Street Lane',
})

myStore.emit('greeting', 'Well, hello there...')
```













<br />
<br />

# TypeScript

Nestore was built with and supports ts out of the box. Types are automatically inferred from `initialStore`.


You can optionally provide a type definition when creating the store

```ts
export interface I_MyStore {
    user: {
        signedIn: boolean;
        name?: string,
        email?: string
    },
    cart?: any[]
}

const NST = nestore<I_MyStore>({
    user: {
        signedIn: false
    },
})
```



<br />

## Interfaces

```ts
const NST: Nestore<Partial<T>> = nestore<T>(initialStore: Partial<T>, options: T_NestoreOptions)
```


```ts
export type T_NestoreOptions = {    // default

    /* The character used to separate wildcards or nested store properties */
    delimiter?: string;             // "."

    /* Set to false to disable the usage of wildcards on event listeners */
    wildcard?: boolean;             // true

    /*  Error messages will contain the event name of the listener that threw the error */
    maxListeners?: number;          // 10

    /* Maximum number of registered listeners before memory leak error is thrown */
    verbose?: boolean;              // false

}
```


```ts
export type T_NestoreEmitStruct = { // example

    /* A full, normalized path to the nested object in the store using the provided delimiter. */
    path: string;                   // "chapter.7.title"

    /* The key used to access the store value, appears as the last segment of `path` */
    key: string;                    // "title"

    /* The current value of this `key` @ `path` after the store was updated */
    value?: any;                    // "A New Chapter"
}
```







<br />
<br />


# About

An exploration of event based datastore management for JavaScript/TypeScript applications. Initially created to manage state and update the display of long-running nodejs CLI programs

**Inspired by Zustand**  - API inspired by the vanilla implementation of [Zustand](https://github.com/pmndrs/zustand)












<br />
<br />


# Contributing

This state-management solutions still requires at least:
- more / advanced test cases
- performance imporovements
- footprint reduction
- better documentation

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change and make sure all tests pass locally before making a pull request.

Please make sure to update tests as appropriate, or suggest new test cases.

### [GitHub Repository](https://github.com/pratiqdev/nestore)
### [GitHub Issues](https://github.com/pratiqdev/nestore/issues)
### [NPM Package](https://npmjs.com/package/nestore)




---
# License

MIT
