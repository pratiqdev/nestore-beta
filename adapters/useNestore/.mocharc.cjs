const config = {
    /** exit after the first failure */
    bail: false,

    /** CHeck for global var mem leaks during tests */
    checkLeaks: true,

    /** How long to wait before marking a test as slow (not failure) */
    slow: 250,

    /** How many times to attempt a failed test */
    // retries: 3,
}

module.exports = config