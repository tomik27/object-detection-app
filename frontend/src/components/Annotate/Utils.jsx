// utils.js

/**
 * Vypočítá obdélník na základě tří bodů (A, B, C) v libovolném pořadí.
 * @param {Object} A - První bod { x, y }.
 * @param {Object} B - Druhý bod { x, y }.
 * @param {Object} C - Třetí bod { x, y }.
 * @returns {Object} - Obdélník s vlastnostmi: šířka, výška, úhel, střed a rohy.
 */
export function computeRectFrom3PointsAnyOrder(A, B, C) {
    // 1) Vypočítáme vektory mezi body
    const { AB, AC, BC } = calculateVectors(A, B, C);

    // 2) Najdeme nejvíce kolmý pár vektorů a určíme roh
    const { cornerPoint, baseVec, perpVec } = findCornerAndVectors(AB, AC, BC, A, B, C);

    // 3) Sestrojíme čtvrtý roh obdélníku
    const { p2, p3, p4, lengthBase, lengthPerp } = calculateFourthCorner(cornerPoint, baseVec, perpVec);

    // 4) Vypočítáme střed obdélníku
    const center = calculateCenter(cornerPoint, p2, p3, p4);

    // 5) Určíme šířku, výšku a úhel obdélníku
    const { width, height, angle, corners } = determineRectangleDimensionsAndOrientation(cornerPoint, p2, p3, p4, baseVec, lengthBase, lengthPerp);

    return {
        width,
        height,
        angle,
        center,
        corners
    };
}
/**
 * Normalizace pixel -> (0..1)
 */
export function normalize(px, py, canvas) {
    return {
        x: px / canvas.width,
        y: py / canvas.height,
    };
}

/**
 * Denormalizace (0..1) -> pixel
 */
export function denormalize(nx, ny, canvas) {
    return {
        x: nx * canvas.width,
        y: ny * canvas.height,
    };
}

export function computeAxisAlignedRect (points) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;
    const center = {x: minX + width / 2, y: minY + height / 2};
    const corners = [
        {x: minX, y: minY},
        {x: maxX, y: minY},
        {x: maxX, y: maxY},
        {x: minX, y: maxY},
    ];
    return {corners, center, width, height, angle: 0};
}

/**
 * Calculates vectors between three points (AB, AC, BC).
 * @param {Object} A - First point { x, y }.
 * @param {Object} B - Second point { x, y }.
 * @param {Object} C - Third point { x, y }.
 * @returns {Object} - Vectors { AB, AC, BC }.
 */
function calculateVectors(A, B, C) {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AC = { x: C.x - A.x, y: C.y - A.y };
    const BC = { x: C.x - B.x, y: C.y - B.y };
    return { AB, AC, BC };
}

/**
 * Finds the most perpendicular pair of vectors and determines the corner point.
 * @param {Object} AB - Vector from A to B.
 * @param {Object} AC - Vector from A to C.
 * @param {Object} BC - Vector from B to C.
 * @param {Object} A - First point { x, y }.
 * @param {Object} B - Second point { x, y }.
 * @param {Object} C - Third point { x, y }.
 * @returns {Object} - Corner point and vectors { cornerPoint, baseVec, perpVec }.
 */
function findCornerAndVectors(AB, AC, BC, A, B, C) {
    const dot = (u, v) => u.x * v.x + u.y * v.y;
    const len = (v) => Math.sqrt(v.x * v.x + v.y * v.y);

    function absDotAngle(u, v) {
        const lu = len(u), lv = len(v);
        if (lu === 0 || lv === 0) return 999999; // degenerace
        return Math.abs(dot(u, v)) / (lu * lv); // 0 => dokonalý pravý úhel
    }

    const scoreAB_AC = absDotAngle(AB, AC);
    const scoreAB_BC = absDotAngle(AB, BC);
    const scoreAC_BC = absDotAngle(AC, BC);

    const minScore = Math.min(scoreAB_AC, scoreAB_BC, scoreAC_BC);

    let cornerPoint, baseVec, perpVec;

    if (scoreAB_AC === minScore) {
        cornerPoint = A;
        baseVec = AB;
        perpVec = AC;
    } else if (scoreAB_BC === minScore) {
        cornerPoint = B;
        baseVec = { x: A.x - B.x, y: A.y - B.y }; // BA
        perpVec = BC;
    } else {
        cornerPoint = C;
        baseVec = { x: A.x - C.x, y: A.y - C.y }; // CA
        perpVec = { x: B.x - C.x, y: B.y - C.y }; // CB
    }

    return { cornerPoint, baseVec, perpVec };
}

/**
 * Calculates the fourth corner of the rectangle using the corner point and vectors.
 * @param {Object} cornerPoint - The corner point of the rectangle.
 * @param {Object} baseVec - The base vector of the rectangle.
 * @param {Object} perpVec - The perpendicular vector of the rectangle.
 * @returns {Object} - Fourth corner points and lengths { p2, p3, p4, lengthBase, lengthPerp }.
 */
function calculateFourthCorner(cornerPoint, baseVec, perpVec) {
    const len = (v) => Math.sqrt(v.x * v.x + v.y * v.y);
    const dot = (u, v) => u.x * v.x + u.y * v.y;

    const lengthBase = len(baseVec);
    if (lengthBase === 0) {
        return {
            p2: cornerPoint,
            p3: cornerPoint,
            p4: cornerPoint,
            lengthBase: 0,
            lengthPerp: 0
        };
    }

    const dxBase = baseVec.x / lengthBase;
    const dyBase = baseVec.y / lengthBase;

    const perp12 = { x: -dyBase, y: dxBase };
    const distancePerp = dot(perpVec, perp12);
    const lengthPerp = Math.abs(distancePerp);

    const ortho = { x: perp12.x * distancePerp, y: perp12.y * distancePerp };
    const p2 = { x: cornerPoint.x + baseVec.x, y: cornerPoint.y + baseVec.y };
    const p4 = { x: cornerPoint.x + baseVec.x + ortho.x, y: cornerPoint.y + baseVec.y + ortho.y };
    const p3 = { x: cornerPoint.x + ortho.x, y: cornerPoint.y + ortho.y };

    return { p2, p3, p4, lengthBase, lengthPerp };
}
/**
 * Calculates the center of the rectangle using its four corners.
 * @param {Object} cornerPoint - The corner point of the rectangle.
 * @param {Object} p2 - Second corner point.
 * @param {Object} p3 - Third corner point.
 * @param {Object} p4 - Fourth corner point.
 * @returns {Object} - Center point { x, y }.
 */
function calculateCenter(cornerPoint, p2, p3, p4) {
    const cx = (cornerPoint.x + p2.x + p4.x + p3.x) / 4;
    const cy = (cornerPoint.y + p2.y + p4.y + p3.y) / 4;
    return { x: cx, y: cy };
}

/**
 * Determines the width, height, angle, and corner order of the rectangle.
 * @param {Object} cornerPoint - The corner point of the rectangle.
 * @param {Object} p2 - Second corner point.
 * @param {Object} p3 - Third corner point.
 * @param {Object} p4 - Fourth corner point.
 * @param {Object} baseVec - The base vector of the rectangle.
 * @param {number} lengthBase - Length of the base vector.
 * @param {number} lengthPerp - Length of the perpendicular vector.
 * @returns {Object} - Rectangle dimensions and orientation { width, height, angle, corners }.
 */
function determineRectangleDimensionsAndOrientation(cornerPoint, p2, p3, p4, baseVec, lengthBase, lengthPerp) {
    const angleDegBase = angleDeg(baseVec);
    const orthoVec = { x: p3.x - cornerPoint.x, y: p3.y - cornerPoint.y };
    const angleDegOrtho = angleDeg(orthoVec);

    const diffHorizBase = Math.min(angleDegBase, 180 - angleDegBase);
    const diffHorizOrtho = Math.min(angleDegOrtho, 180 - angleDegOrtho);

    let width, height, angle, corners;
    if (diffHorizBase <= diffHorizOrtho) {
        width = lengthBase;
        height = lengthPerp;
        angle = angleDegBase;
        corners = [cornerPoint, p2, p4, p3];
    } else {
        width = lengthPerp;
        height = lengthBase;
        angle = angleDegOrtho;
        corners = [cornerPoint, p3, p4, p2];
    }

    // Normalizace úhlu
    if (angle < 0) angle += 360;
    if (angle >= 180) angle -= 180;

    return { width, height, angle, corners };
}

/**
 * Calculates the angle of a vector relative to the x-axis in degrees.
 * @param {Object} v - Vector { x, y }.
 * @returns {number} - Angle in degrees [0, 180).
 */

function angleDeg(v) {
    let a = Math.atan2(v.y, v.x) * (180 / Math.PI);
    if (a < 0) a += 360;
    if (a >= 180) a -= 180;
    return a;
}

