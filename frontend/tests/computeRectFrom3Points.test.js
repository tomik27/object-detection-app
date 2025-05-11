import {computeRectFrom3PointsAnyOrder} from "../src/components/Annotation/Utils.jsx";

describe('computeRectFrom3PointsAnyOrder', () => {
    const testCases = [
        {
            p1: {x: 0, y: 0},
            p2: {x: 1, y: 0},
            p3: {x: 0, y: 1},
            description: 'points in bottom-left, bottom-right, and top-left'
        },
        {
            p1: {x: 0, y: 0},
            p2: {x: 0, y: 1},
            p3: {x: 1, y: 0},
            description: 'points in bottom-left, top-left, and bottom-right'
        },
        {
            p1: {x: 1, y: 0},
            p2: {x: 0, y: 0},
            p3: {x: 0, y: 1},
            description: 'points in bottom-right, bottom-left, and top-left'
        },
        {
            p1: {x: 1, y: 0},
            p2: {x: 0, y: 1},
            p3: {x: 0, y: 0},
            description: 'points in bottom-right, top-left, and bottom-left'
        },
        {
            p1: {x: 0, y: 1},
            p2: {x: 0, y: 0},
            p3: {x: 1, y: 0},
            description: 'points in top-left, bottom-left, and bottom-right'
        },
        {
            p1: {x: 0, y: 1},
            p2: {x: 1, y: 0},
            p3: {x: 0, y: 0},
            description: 'points in top-left, bottom-right, and bottom-left'
        },
        {
            p1: {x: 1, y: 1},
            p2: {x: 0, y: 1},
            p3: {x: 1, y: 0},
            description: 'points in top-right, top-left, and bottom-right'
        },
        {
            p1: {x: 1, y: 1},
            p2: {x: 1, y: 0},
            p3: {x: 0, y: 1},
            description: 'points in top-right, bottom-right, and top-left'
        },
        {
            p1: {x: 1, y: 0},
            p2: {x: 1, y: 1},
            p3: {x: 0, y: 1},
            description: 'points in bottom-right, top-right, and top-left'
        },
        {
            p1: {x: 0, y: 1},
            p2: {x: 1, y: 1},
            p3: {x: 1, y: 0},
            description: 'points in top-left, top-right, and bottom-right'
        },
        {
            p1: {x: 0, y: 0},
            p2: {x: 0, y: 1},
            p3: {x: 1, y: 1},
            description: 'points in bottom-left, top-left, and top-right'
        },
        {
            p1: {x: 0, y: 0},
            p2: {x: 1, y: 1},
            p3: {x: 0, y: 1},
            description: 'points in bottom-left, top-right, and top-left'
        },
        {
            p1: {x: 1, y: 0},
            p2: {x: 1, y: 1},
            p3: {x: 0, y: 1},
            description: 'points in top-right, bottom-right, and bottom-left'
        },
    ];

    testCases.forEach(({p1, p2, p3, description}, index) => {
        test(`should return correct rectangle for ${description}`, () => {
            const result = computeRectFrom3PointsAnyOrder(p1, p2, p3);

            expect(result.center).toEqual({x: 0.5, y: 0.5});
            expect(result.width).toBeCloseTo(1);
            expect(result.height).toBeCloseTo(1);
            expect(result.corners).toContainEqual({x: 1, y: 1});
        });
    });

    test('should return correct rectangle for points in bottom-right and top-right', () => {
        const p1 = {x: 0, y: 0};
        const p2 = {x: 4, y: 0};
        const p3 = {x: 4, y: 3};

        const result = computeRectFrom3PointsAnyOrder(p1, p2, p3);

        expect(result.center).toEqual({x: 2, y: 1.5});
        expect(result.width).toBeCloseTo(4);
        expect(result.height).toBeCloseTo(3);
        expect(result.corners).toContainEqual({x: 0, y: 3});
    });

    test('should handle zero-length vector gracefully', () => {
        const p1 = {x: 1, y: 1};
        const p2 = {x: 1, y: 1};
        const p3 = {x: 1, y: 1};

        const result = computeRectFrom3PointsAnyOrder(p1, p2, p3);

        expect(result.angle).toBe(0);
        expect(result.width).toBe(0);
        expect(result.height).toBe(0);
        expect(result.center).toEqual({x: 1, y: 1});
    });

});

    describe('computeRectFrom3PointsAnyOrder', () => {
        const testCases = [
            {
                p1: {x: 0, y: 0},
                p2: {x: 1, y: 0},
                p3: {x: 0, y: 2},
                description: 'points in bottom-left, bottom-right, and top-left with width 1 and height 2'
            },
            {
                p1: {x: 0, y: 0},
                p2: {x: 0, y: 2},
                p3: {x: 1, y: 0},
                description: 'points in bottom-left, top-left, and bottom-right with width 1 and height 2'
            },
            {
                p1: {x: 1, y: 0},
                p2: {x: 0, y: 0},
                p3: {x: 0, y: 2},
                description: 'points in bottom-right, bottom-left, and top-left with width 1 and height 2'
            },
            {
                p1: {x: 1, y: 0},
                p2: {x: 0, y: 2},
                p3: {x: 0, y: 0},
                description: 'points in bottom-right, top-left, and bottom-left with width 1 and height 2'
            },
            {
                p1: {x: 0, y: 2},
                p2: {x: 0, y: 0},
                p3: {x: 1, y: 0},
                description: 'points in top-left, bottom-left, and bottom-right with width 1 and height 2'
            },
            {
                p1: {x: 0, y: 2},
                p2: {x: 1, y: 0},
                p3: {x: 0, y: 0},
                description: 'points in top-left, bottom-right, and bottom-left with width 1 and height 2'
            },
        ];

        testCases.forEach(({p1, p2, p3, description}, index) => {
            test(`should return correct rectangle for ${description}`, () => {
                const result = computeRectFrom3PointsAnyOrder(p1, p2, p3);

                expect(result.center).toEqual({x: 0.5, y: 1});
                expect(result.width).toBeCloseTo(1);
                expect(result.height).toBeCloseTo(2);
                expect(result.corners).toContainEqual({x: 1, y: 2});
            });
        });

    });