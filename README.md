<p align="center">
<img src="https://raw.githubusercontent.com/pratiqdev/public-images/master/logo-v3-square-transparent.png" align="center" />
</p>

<p align='center'>
<img src='https://img.shields.io/badge/license_MIT-blue'>
<img src='https://img.shields.io/badge/npm_0.0.1-blue'>
<img src='https://img.shields.io/badge/tests_passing-blue'>
</p>


<p align='center'>A simple key-value store with a powerful real-time state management API</p>
<!-- <p align='center'>Event based real-time state management API with single-source-of-truth and two-way data binding</p> -->
<!-- <p align='center'>Access, monitor and update values with events.</p> -->
<!-- <p align='center'>Support for persistent storage with included or custom adapters.</p> -->
<!-- <p align='center'>In-store mutator functions for easy to manage logic.</p> -->


<!-- > Cool words:  
> - Event-based architecture (All store actions are event based)
> - real-time state management
> - two-way data binding (IF mutable: true)
> - single-source-of-truth  
> - In store mutator functions
> - Built in + custom middleware / adapters
> - restrictable mutability -->



- [Getting Started](#getting-started)
  - [Create a Store](#create-a-store)
  - [Access the Store](#access-the-store)
  - [Update the Store](#update-the-store)
  - [Remove from the Store](#remove-from-the-store)
  - [Reset the Store](#reset-the-store)
- [Store Events](#store-events)
  - [Listen to Changes](#listen-to-changes)
- [Store Events](#store-events-1)
  - [On Update](#on-update)
  - [Manual Emit](#manual-emit)
- [Custom Mutator functions](#custom-mutator-functions)
- [TypeScript](#typescript)
  - [Interfaces](#interfaces)
- [About](#about)
- [Contributing](#contributing)
    - [GitHub Repository](#github-repository)
    - [GitHub Issues](#github-issues)
    - [NPM Package](#npm-package)
- [License](#license)



<br />
<br />

# Getting Started


Install using a package manager like npm or yarn, or import from a cdn:

```bash
yarn add nestore
```

```html
<script src="https://unpkg.com/nestore"></script>
```

<!-- > [almost Object] nestore does not support symbols when parsing nested objects for paths or keys -->






<br />

## Create a Store

Import nestore and create a store. The store is an object that contains the current values of the state. 
The store can hold any values, nested at any depth, that can be accessed from anywhere. The store always maintains the same reference allowing for a `single-source-of-truth`.

Import nestore, create your store, and export it.

```ts
const nst = nestore({ 
    logged_in: false,
    user_name: null,
    time: Date.now()
    1: () => 'zero'
})

export default nst
```







<br />

## Access the Store

All values are available through the store **except in-store-mutators**. 
Use the get method for easy or programmatic access to paths, or access the values directly through the store. Later we will react to changes with [events](#store-events).

> The store is a mutable object with persistent references. Any direct access
> to `nst.store.<path>` will return that value with its current reference. Be cautious of unintended updates to store values by reference.


```ts
import nst from './myStore.js'

let loggedIn = nst.get('logged_in')
let user = nst.store.user_name
```






<br />

## Update the Store

You can manually update/create values/keys externally using the `set` method or by updating the value directly. 
You can also update the entire store using either of these methods. Setting the value
to `null` or `undefined` will not remove the key from the store.

```ts
import nst from './myStore.js'

nst.logged_in = false
nst.set('user_name', null)
```


<br />

## Remove from the Store

To completely remove a key from the store 'object' - use the `remove` method. Th
<!-- TODO- Should `remove` method have optional emit flags? -->
```ts
nst.remove('user_name')
```

<br />

## Reset the Store

Nestore keeps a copy (deep-clone) of the original store and provides a `reset`
method.

<!--
 How are adapters going to hangle 'orginal-state'
 Will they assume that the first successful load of the adapter-storage is the 'original'? 
That would require a 3rd deep-cloned copy of the original store, or overriding the first 'original' 
with the adapters new 'original'
 -->
<!-- TODO- reset should have `reset(flag)` with same options as `emit` -->

```ts
import nst from './myStore.js'

nst.logged_in = false
nst.set('user_name', null)
```









<br />
<br />

# Store Events

All actions and events within the store emit events that can be used to trigger external behavior when the data changes. Many storage mediums use
the pub/sub pattern to react to real-time changes to data.



<br />

## Listen to Changes

Nestore provides a method for registering an `event listener` that 
subscribes to a specific path, provided as the first argument to the `nst.on` method, and a callback to handle logic as the second argument. The callback will be always be invoked with an object of type `NSTEmit`.

```ts
nst.on('path', ({ path, key, value }) => {

})
```
























<!-- ~                                                 -->

<br />


# Store Events

<!-- <details><summary><b>oii</b></summary><br>
Updates to the store emit events containing which path and key was changed, the new value and a timestamp of the event.
</details> -->

Updates to the store emit events containing which path and key was changed, the new value and a timestamp of the event.

> **Nestore extends the EventEmitter2 API**  
> Documentation for all `EE2` methods can be found [here](https://www.npmjs.com/package/eventemitter2)


<br />

## On Update

Register event listeners on a key to watch for updates and trigger a callback. 
The `set` method causes the store to emit an event containing the key, value and path that was updated.

```ts
myStore.on('user.**', ({ path, key, value }) => {
    console.log(`Path ${path} was changed to ${value}`)
})
```

You can also register listeners directly in the store with the `$` prefix. These are great for managing repeatable async operations, eg: fetching user data when a `user_name` value changes.

```ts
const myStore = nestore({
    name: null,
    online: false,

    $name: (nst, event) => nst.set('online', event.value ? true : false)
})
```







<br />

## Manual Emit

You can also manually emit events to force update a listener. The value provided to the emit method *should* be an object with the type `T_NSTEmit`, but any values / types provided will be emitted.


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

# Custom Mutator functions

Manage all store logic in a single place with custom in-store mutator functions.

These can be any type of function (async/sync) and return any value. Just set the state when the 
values are ready.


```ts
const myStore = nestore({
    user_name: null,
    user_data: null,

    fetchUserData: async (nst, [name]) => {
        const { data } = await axios.get(`/api/users/${name}`)
        nst.set('user_data', data)
        return data
    }
})

// just run the function
myStore.fetchUserData('Johnny68')

// wait for the return value
let userData = await myStore.fetchUserData('Johnny68')
```











<br />
<br />

# TypeScript

<!-- TODO- List all exported types that are available to users -->

Nestore was built with and supports TypeScript out-of-the-box. Types are automatically inferred from the provided `initialStore` or you can optionally provide a type definition when creating the store.

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
export type T_NSTEmitStruct = { // example

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
