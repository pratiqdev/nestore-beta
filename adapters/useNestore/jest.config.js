import fs from 'fs'
const __dir = fs.realpathSync('.')

// FIXME - Setup jest for use with es modules ( useNestore > nestore > lodash-es | eventtemitter2 )


export default {
  // preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: [
    // 'node_modules',
    // add the directory with the test-utils.js file, for example:
  //  'test', // a utility folder
    __dir, // the root directory
  ],
  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/test/tests/**/*.[jt]s?(x)",
    "**/test/tests/**/*.mjs",
  ],

  // A map from regular expressions to paths to transformers
  // transform: {},
  preset: 'ts-jest',
  transform: {
    '.*\.ts|.*\.tsx': 'ts-jest',
    '.*\.js|.*\.jsx': 'babel-jest',
    // '**/test/tests/**/*.[j]s?(x)': 'babel-jest',
    // "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/lodash-es/.*"
  ]

};