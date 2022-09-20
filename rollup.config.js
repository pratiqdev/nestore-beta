// export default {
//     input: 'dist/nestore.js',
//     external: [
//       'node_modules/eventemitter2'
//     ],
//     output: {
//       file: 'bundle/nestore-bundle.js',
//       format: 'umd'
//     }
//   };


import merge from 'deepmerge';
import { createBasicConfig } from '@open-wc/building-rollup';

const baseConfig = createBasicConfig();

export default merge(baseConfig, {
  input: './out-tsc/src/nestore.js',
  external: [
    'node_modules/debug'
  ],
  output: {
      file: 'nestore-bundle.js',
      format: 'umd',
      dir: '/bundle', 
  }
});