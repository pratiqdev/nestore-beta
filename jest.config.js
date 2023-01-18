/** @type {import('jest').Config} */

export default {
    transform: {
        "^.+\\.(js|jsx)$": "babel-jest"
    },
    testMatch: [
        '**/?(*.)+(unit).[jt]s?(x)'
    ]
}
