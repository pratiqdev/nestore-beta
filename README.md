![logo-banner](./public/nestore-logo-5.png)

A simple ESMap based store with a powerful event interface. Setup is easy with Nestore, just import, create, and export your store!

> **Inspired by Zustand**  
> An exploration of event based datastore management for JavaScript/TypeScript applications.  
> API inspired by the vanilla implementation of [Zustand](https://github.com/pmndrs/zustand)



<br />
<br />

# Installation

Install using a package manager like npm or yarn:

```bash
yarn add nestore
```




<br />

# Basic Usage

Import nestore and create a store

```ts
import nestore from 'nestore'

const myStore = nestore({ 
    hello: 'there' 
})

export default myStore
```

In your application, use the `get` and `set` methods to interact with the store

```ts
import myStore from './my-store.ts'

let value = myStore.get('hello')  // => "there"
myStore.set('hello', 'World!')    // => true; 
```

Then register event listeners on a key to watch for updates and trigger a callback:

```ts 
myStore.on('hello', (data) => {
    console.log(data)
    // data.path:  "hello"
    // data.key:   "hello"
    // data.value: "World!"
})
```



<br />

# Store Events 




## On Updates

The `set` method causes the store to emit an event containing the key, value and path that was updated.

```ts
import nestore from 'nestore'

const myStore = nestore({ 
    user: {
        name: 'Alice',
        email: 'AliceA.@email.com'
    }
})

// Register a listener on the value
myStore.on('hello', ({key, value}) => console.log(`The key ${key} was changed to:`, value))

myStore.set('hello', 'World!')
```



## Manual Emit

You can also manually emit events to force update a listener. The value provided to the emit method should be an object with the type `T_NestoreEmit`.


```ts
myStore.emit('address', {
    key: 'address',
    path: 'user.location.address',
    value: '1234 Street Lane'
})
```



# TypeScript

Nestore was built with and supports ts out of the box. Types are automatically inferred from `initialStore`.


You can optionally provide a type definition when creating the store:

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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change and make sure all tests pass before making a pull request.

Please make sure to update tests as appropriate.

### [GitHub Repository](https://github.com/pratiqdev/nestore)
### [GitHub Issues](https://github.com/pratiqdev/nestore/issues)
### [NPM Package](https://npmjs.com/package/nestore)




---
## License

MIT
