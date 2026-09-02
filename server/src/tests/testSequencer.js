import SequencerModule from '@jest/test-sequencer';

const BaseSequencer = SequencerModule.default || SequencerModule;

class CustomSequencer extends BaseSequencer {
    /**
     * Sort test suites in strictly alphabetical and numerical order (e.g., 01 -> 02 -> 10)
     * @param {Array<{path: string, duration?: number}>} tests
     * @returns {Array<{path: string, duration?: number}>}
     */
    sort(tests) {
        const copyTests = Array.from(tests);
        return copyTests.sort((testA, testB) =>
            testA.path.localeCompare(testB.path, undefined, {
                numeric: true,
                sensitivity: 'base',
            }),
        );
    }
}

export default CustomSequencer;
