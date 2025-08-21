import { describe, test, expect } from '@jest/globals';

describe("Jest Setup Test", () => {
    test('typescript and jest are working', () => {
        const result: number = 1 + 1;
        expect(result).toBe(2);
    });


});