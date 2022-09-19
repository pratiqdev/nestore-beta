

export type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    allowDirectModification?: boolean;
    maxListeners?: number;
    verboseMemoryLeak?: boolean;
    diffFunction?: (a:any, b:any) => Object;
}


/** Structure of all values emitted by eventemitter */
export type T_EmitStruct = {
    path: string;
    key: string;
    value: any;
}











//___________________________________________________________________________________________
//___________________________________________________________________________________________

// var emitter = new EE2({

//     // set this to `true` to use wildcards
//     wildcard: false,
  
//     // the DELIMITER used to segment namespaces
//     DELIMITER: '.', 
  
//     // set this to `true` if you want to emit the newListener event
//     newListener: false, 
  
//     // set this to `true` if you want to emit the removeListener event
//     removeListener: false, 
  
//     // the maximum amount of listeners that can be assigned to an event
//     maxListeners: 10,
  
//     // show event name in memory leak message when more than maximum amount of listeners is assigned
//     verboseMemoryLeak: false,
  
//     // disable throwing uncaughtException if an error event is emitted and it has no listeners
//     ignoreErrors: false
//   });