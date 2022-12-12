# create and test a react hook

# consider emitting the previous state or running an internal diff
- current state: { hello: 'world' }
- user updates the state: { hello: 'silence' }
- prevState ('world') compared to ('silence')
  - if they are different: emit the event


# option to add a list of automatic callbacks for custom setters
- store has state: { user: 'john', greeting: 'hello' }
- store has setter: `changeGreeting: (newGreeting) => state.greeting = 'hello ${value}'`
- store has cbs: `{ 'user': changeGreeting }`
- this would invoke `changeGreeting` with the new value any time the value of `user` changes, 


# Middleware

- new nestore instance created
- load initialStore into store
- if middleware: register middleware,
- middleware must have a non-empty namespace string for eventNames
- middleware will register EE listeners for store changes and trigger custom logic
- middleware will hydrate the store once data is retrieved
- middleware must emit @namespace_loading / @namespace_loaded / @namespace_error events
- ? middleware must emit event for EVERY KEY:VAL THAT GETS UPDATED - CANT USE THE nst.set({ ...newStore }) method as this emits a single event

**CONCERNS**

- what if localStorage and db are desynced


---

A simple key-value store with a powerful real-time state management api. 

Access, monitor and update values with events.  
Support for persistent storage with included or custom adapters.  
In-store mutation functions for easy to manage logic.

Setup is easy - just create, and export your store!





# Readme - cool stuff to note in the readme intro section

> **Inspired by Zustand**  
> An exploration of event based datastore management for JavaScript/TypeScript applications.  
> API inspired by the vanilla implementation of [Zustand](https://github.com/pmndrs/zustand)


## Easy to access, monitor and update deeply nested state
## Listen for changes to the store with EE2 event methods
## Extend nestore with custom adapters (or use the included persist / mongo adapters)
## Use in-store setters for easy to manage logic
