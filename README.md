<p align="center">
<img src="https://raw.githubusercontent.com/pratiqdev/public-images/master/logo-v3-square-transparent.png" align="center" />
</p>

<p align='center'>
<img src='https://img.shields.io/badge/license_MIT-blue'>
<img src='https://img.shields.io/badge/npm_0.0.44-blue'>
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
  - [Installation](#installation)
  - [Usage](#usage)
- [Store Actions](#store-actions)
  - [Create a Store](#create-a-store)
  - [Access the Store](#access-the-store)
  - [Update the Store](#update-the-store)
  - [Remove from the Store](#remove-from-the-store)
  - [Reset the Store](#reset-the-store)
- [Store Events](#store-events)
  - [Listen to Changes](#listen-to-changes)
  - [Emit Changes](#emit-changes)
  - [Manual Emit](#manual-emit)
- [Common Emitter Methods](#common-emitter-methods)
  - [emit](#emit)
  - [on / off](#on--off)
- [Full API](#full-api)
  - [Types](#types)
  - [Nestore Async Generator](#nestore-async-generator)
  - [Nestore Options](#nestore-options)
  - [Properties](#properties)
  - [Methods](#methods)
  - [In Store Listeners](#in-store-listeners)
  - [In Store Mutators](#in-store-mutators)
  - [Adapters](#adapters)
- [About](#about)
- [Contributing](#contributing)
    - [GitHub Repository](#github-repository)
    - [GitHub Issues](#github-issues)
    - [NPM Package](#npm-package)
- [License](#license)

<br />
<br />

# Getting Started


## Installation

Install using your preferred package manager, or import from a cdn:

```bash
yarn add nestore
```

```html
<script src="https://unpkg.com/nestore"></script>
```






<!-- > [almost Object] nestore does not support symbols when parsing nested objects for paths or keys -->
## Usage

Import (or require) nestore and create a store with values, setters and listeners all in one place
```ts
// store.js
import nestore from 'nestore'

const nst = nestore({
    logged_in: false,
    user: null,
    messages: [],
    login: (NST, [name, password]) => {
        NST.set('logged_in', true)
        NST.store.user = name
    }
})

export default nst
```

Then import your store, register listeners on any path, and interact with the store
```ts
// app.js
import nst from './store.js'

nst.on('user', ({ key, path, value }) => {
    console.log(`Logged in as ${value}`)
})

nst.login('Alice', '1234')
nst.set('messages')
```

Nestore will automatically infer the types from the values in the `initialStore`, or you can provide
a custom type definition for more type-safety

```ts
export type MyStore = {
    user: null | MyUser;
    messages: MyMessage[]
}

export type MyUser = {
    id: number;
    name: string;
}

export type MyMessage =  {
    time: number;
    text: string;
    media?: string[];
}

const myStore = nestore<MyStore>({
    user: null,
    messages: [],
})
```




# Store Actions


<br />

## Create a Store

Import nestore and create a store. The store is an object that contains the current values of the state. 
The store can hold any values, nested at any depth, that can be accessed from anywhere. The store always maintains the same reference allowing for a `single-source-of-truth`.

Import nestore, create your store, and export it.

```ts
import nestore from 'nestore'

const nst = nestore({ 
    logged_in: false,
    user_name: null,
    time: Date.now()
    1: 'one',
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

To completely remove a key from the store 'object' - use the `remove` method.
This will emit an event for the provided path.
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
<br />

# Store Events

All actions and events within the store emit events that can be used to trigger external behavior when the data changes. Many storage mediums use
the pub/sub pattern to react to real-time changes to data.



<br />
<hr />

## Listen to Changes

Nestore provides a method for registering an `event listener` that 
subscribes to a specific path, provided as the first argument to the `nst.on` method, and a callback to handle logic as the second argument. The callback will be always be invoked with an object of type `NSTEmit`.

```ts
nst.on('/', ({ value }) => {
    // react to the entire store (path and key are '/')
})
nst.on('path', ({ path, key, value }) => {
    // react to any changes to 'path'
})
```

Thanks to [eventemitter2](https://npmjs.com/eventemitter2) we can listen to
nested paths in objects and arrays. See more emitter methods and examples in 
[Common Emitter Methods](#common-emitter-methods)

```ts
nst.on('users.*.logged_in', ({ path, key, value }) => {
    // react to any users `logged_in` status
})
```

*or* we can use some convenience/utility methods provided by `ee2` like:

```ts
// invoke the callback, then remove the lsitener
nst.once('path', () => {})
// invoke the callback n times, then remove the lsitener
nst.many('path', 5, () => {})
// invoke a callback on any change to the store
nst.onAny('path', () => {})
```



## Emit Changes

Any update to the store using the `set` method will emit events for all paths/keys that
were modified by the update

> Events will only be emitted if the values are different (shallow equality) when
> `preventRepeatUpdates` is true, and when the emit flag is omitted or set to 'emit' or 'all'.
> See the [Full API section](#full-api)





## Manual Emit

You can also manually emit events to force update a listener. The value provided to the emit method *should* be an object with the type `T_NSTEmit`, but any values / types provided will be emitted.





















<br />
<br />

# Common Emitter Methods

Nestore extends the `event-emitter-2` class. Visit the [ee2 npm page](https://www.npmjs.com/package/eventemitter2) to view the full documentation of every method included with the 
event emitter.


## emit
Execute each of the listeners that may be listening for the specified event name in order with the list of arguments.
emitter.
```ts
emitter.emit(event | eventNS, [arg1], [arg2], [...])
```

## on / off
Execute each of the listeners that may be listening for the specified event name in order with the list of arguments.

Same as `addListener` and `removeListener`
```ts
emitter.emit(event | eventNS, [arg1], [arg2], [...])
```






# Full API

## Types

`NSTOptions`  
`NSTEmit`  
`...`  

## Nestore Async Generator
<!-- This needs a shorter / more concise name  -->

## Nestore Options

`delimiter`  
`adapters` [See Adapters](#adapters)


## Properties
`maxListeners`  
`delimiter`

## Methods

## In Store Listeners

## In Store Mutators

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




## Adapters















<br />
<br />





<br />
<br />
<br />


# About

An exploration of event based datastore management for JavaScript/TypeScript applications. Initially created to manage state and update the display of long-running nodejs CLI programs

**Inspired by Zustand**  - API inspired by the vanilla implementation of [Zustand](https://github.com/pmndrs/zustand)












<br />
<br />
<br />


# Contributing

This state-management solutions still requires at least:
- more / advanced test cases
- performance imporovements
- footprint reduction
- better documentation
- test `listenTo()` *Listens to the events emitted by an external emitter and propagate them through itself.*

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change and make sure all tests pass locally before making a pull request.

Please make sure to update tests as appropriate, or suggest new test cases.

### [GitHub Repository](https://github.com/pratiqdev/nestore)
### [GitHub Issues](https://github.com/pratiqdev/nestore/issues)
### [NPM Package](https://npmjs.com/package/nestore)





<br />
<br />
<br />

# License

MIT
