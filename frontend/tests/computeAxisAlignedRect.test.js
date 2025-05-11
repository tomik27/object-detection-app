import {computeAxisAlignedRect} from "../src/components/Annotation/Utils.jsx";


describe('computeAxisAlignedRect – parameterized tests', () => {
    // [ array of points,   expected minX, maxX, minY, maxY,      description ]
    const cases = [
        [ [{ x: 0, y: 0 }],        0,   0,   0,   0,  'single point (degenerate)' ],
        [ [{ x: 0, y: 0 }, { x: 4, y: 3 }], 0,   4,   0,   3,  'basic rectangle' ],
        [ [{ x: 4, y: 3 }, { x: 0, y: 0 }], 0,   4,   0,   3,  'reverse order' ],
        [ [{ x: 2, y: 1 }, { x: 0, y: 3 }, { x: 4, y: 0 }], 0, 4, 0, 3, 'three corners in any order' ],
        [ [{ x: 1, y: 5 }, { x: 3, y: 5 }], 1,   3,   5,   5,  'horizontal segment' ],
        [ [{ x: 2, y: -1 }, { x: 2, y: 4 }], 2,   2,  -1,   4,  'vertical segment' ],
        [ [{ x: -1, y: -2 }, { x: 2, y: 3 }, { x: 0, y: 0 }], -1, 2, -2, 3, 'negative and positive coords' ],
        [ [{ x: 0, y: 0 }, { x: 4, y: 3 }, { x: 2, y: 1 }],   0,   4,   0,   3,  'with interior points (ignored)' ],
    ];

    test.each(cases)(
        '%s → minX=%d, maxX=%d, minY=%d, maxY=%d (%s)',
        (points, minX, maxX, minY, maxY, description) => {
            const { corners, center, width, height, angle } = computeAxisAlignedRect(points);

            // Check width, height, and angle
            expect(width).toBeCloseTo(maxX - minX);
            expect(height).toBeCloseTo(maxY - minY);
            expect(angle).toBe(0);

            // Check center
            expect(center).toEqual({
                x: minX + width / 2,
                y: minY + height / 2,
            });

            // Expected corners in fixed order
            const expectedCorners = [
                { x: minX, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: maxY },
                { x: minX, y: maxY },
            ];
            expect(corners).toEqual(expectedCorners);
        }
    );
});