![logo-banner](logo.png)

<p align='center'>
<img src='https://img.shields.io/badge/license_MIT-darkblue'>
<img src='https://img.shields.io/badge/npm_1.0.0-darkblue'>
<img src='https://img.shields.io/badge/tests_passing-darkblue'>
</p>
<h4 align='center'>A simple key-value store with a powerful real-time state management api. </h4>
<p align='center'>Access, monitor and update values with events.</p>
<p align='center'>Support for persistent storage with included or custom adapters.</p>
<p align='center'>In-store mutator functions for easy to manage logic.</p>




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

## Usage

Import nestore and create a store. The store is an object that contains all the state, and optionally contains in-store mutator functions

```ts
import nestore from 'nestore'

const myStore = nestore({ 
    current_time: Date.now(),
    logged_in: false,
    user_name: null,
    setUserName: (nst, [name]) => nst.store.user_name = name,
    getUserData: async (nst, args) => {
        const { data } = await axios.get(`/api/user-data/${nst.store.user_name}`)
        nst.set('user_data', data)
        return data
    },
})

export default myStore
```

Register event listeners on a key to watch for updates and trigger a callback:

```ts
myStore.on('user.**', ({ path, key, value }) => {
    console.log(`Path ${path} was changed to ${value}`)
})
```

Use the `get` and `set` methods to interact with the store, or custom in-store functions

```ts
import myStore from './my-store.ts'

myStore.set('current_time', Date.now())
myStore.setUserName('Alice')
```












<br />
<br />
<br />

# Store Events 

Updates to the store emit events containing which path and key was changed, the new value and a timestamp of the event.

> **Nestore extends the EventEmitter2 API**  
> Documentation for all `EE2` methods can be found [here](https://www.npmjs.com/package/eventemitter2)


<br />
<hr />

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
<hr />

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
<br />

# Adapters

Enhance the functionality of your store with the included adapters for persistent storage, or create a custom adapter.

This package includes two adapters:
- **persistAdapter** - for browser based string storage like localStorage
- **mongoAdapter** - for interacting with MongoDB





<br />
<hr />

## persistAdapter

**This adapter is built for browser storage objects like localStorage**

This adapter requires a key to reference the item in storage `storageKey` and will use localStorage by default.  
You can supply any storage object that has `getItem` and `setItem` methods.


```ts
const storageAdapter = persistAdapter(
    // namespace used when emitting adpater events
    namespace:  string  = 'nestore-persist', 
    // key used to set/retrieve data from storage
    storageKey: string,
    // Any storage object
    storage:    Storage,
    // Wait n milliseconds since the last nestore update to update storage 
    batchTime:  number  = 10_000
)

const myStore = nestore(initialStore, { adapter: storageAdapter })
```




<br />
<hr />


## mongoAdapter

**This adapter is built for MongoDB**

```ts
const storageAdapter = mongoAdapter(
    // namespace used when emitting adpater events
    namespace:string = 'mongo-adapter', 
    // connection string for your mongo db
    mongoUri: 'mongo-uri-connection-string',
    // mongoDB collection name 
    collectionName: 'my-mongo-collection',
    // document key - collection name used if null
    documentKey: 'my-document',
    // Wait n milliseconds since the last nestore update to update storage 
    batchTime:number = 10_000

)

const myStore = nestore(initialStore, { adapter: storageAdapter })
```








<br />
<hr />


## Adapter Events

All adapters emit the following events when initializing or interacting with the store.

### `@namespace.registered`

Emitted when the adapter is registered 
```ts
nst.emit(`@namespace.registered`, namespace)
```

### `@namespace.loading`

Emitted when the adapter is registered 
```ts
nst.emit(`@namespace.loading`, { ...store })
```



### `@namespace.loaded`

Emitted when the adapter is registered 
```ts
nst.emit(`@namespace.loaded`, { ...store })
```



### `@namespace.saving`

Emitted when the adapter is registered 
```ts
nst.emit(`@namespace.saving`, { ...store })
```



### `@namespace.saved`

Emitted when the adapter is registered 
```ts
nst.emit(`@namespace.saved`, { ...store })
```

### `@namespace.error`

Emitted when the adapter has an internal error
```ts
nst.emit(`@namespace.error`, error)
```












<br />
<hr />

<h2>Custom Adapter</h2>

- Adapters should sync after save by requesting data from storage and loaded what was returned from storage after the update (most db operations return the updated db entry after mutations)


Example:
```ts
const myAdapter = (
    MY_DB_URI: string,
    TABLE_NAME: string,
) => (nst) => {
    try{

        nst.emit('@my-adapter.registered', namespace)

        myStorage.init(MY_DB_URI, TABLE_NAME)

        const loadData = async () => {
            nst.emit('@my-adapter.loading', nst.store)
            const { data } = await myStorage.getData()
            nst.set(data)
            nst.emit('@my-adapter.loaded', nst.store)
        }

        const saveData = async () => {
            nst.emit('@my-adapter.saving', nst.store)
            const { data } = await myStorage.saveData(nst.store)
            nst.set(data)
            nst.emit('@my-adapter.saved', nst.store)
        }

        nst.onAny(saveData)

        loadData()
            
    }catch(err){
        nst.emit('@my-adapter.error', err)
    }

}
```
> ## Prevent excessive DB operations
> This example does not include a method of throttling or checking for successful writes to the dataabase.  
> You should provide a method for throttling read/write requests to the database on repeated store 
> updates and a method for confirming writes / syncinc





<br />
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

#### [GitHub Repository](https://github.com/pratiqdev/nestore)
#### [GitHub Issues](https://github.com/pratiqdev/nestore/issues)
#### [NPM Package](https://npmjs.com/package/nestore)





<br />
<br />
<br />

# License

MIT
