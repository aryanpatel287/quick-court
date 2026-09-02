export default {
    testEnvironment: 'node',
    transform: {},
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
    testTimeout: 30000,
    testMatch: ['<rootDir>/src/tests/modules/**/*.test.js'],
    verbose: true,
    forceExit: true,
};
