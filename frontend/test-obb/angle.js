/**
 * Vypočítá orientovaný bounding box z 3 rohů obdélníku.
 * @param {Object} p1 - { x: number, y: number }
 * @param {Object} p2 - { x: number, y: number }
 * @param {Object} p3 - { x: number, y: number }
 * @returns {Object} { angle, width, height, center: {x,y}, corners: [p1, p2, p4, p3] }
 */
function computeOBBFrom3Points(p1, p2, p3) {
    // Vektory od p1 k p2 a od p1 k p3
    const v12 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v13 = { x: p3.x - p1.x, y: p3.y - p1.y };

    // ÚHEL hrany p1→p2 k ose X
    let angleDeg = (Math.atan2(v12.y, v12.x) * 180) / Math.PI;
    // Normalizace do rozsahu [0..360)
    if (angleDeg < 0) angleDeg += 360;

    // Velikost hrany p1→p2 a p1→p3
    const width = Math.sqrt(v12.x * v12.x + v12.y * v12.y);
    const height = Math.sqrt(v13.x * v13.x + v13.y * v13.y);

    // Čtvrtý roh p4 = p2 + (p3 - p1)
    const p4 = {
        x: p1.x + v12.x + v13.x,
        y: p1.y + v12.y + v13.y,
    };

    // Střed obdélníku (průměr všech rohů)
    const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
    const cy = (p1.y + p2.y + p3.y + p4.y) / 4;

    return {
        angle: angleDeg,
        width,
        height,
        center: { x: cx, y: cy },
        corners: [p1, p2, p4, p3],
    };
}
/**
 * Vygeneruje tři rohy obdélníku (p1, p2, p3) o rozměrech w x h,
 * otočeného o angleDeg kolem počátku (0,0), a posune o [offsetX, offsetY].
 */
function generate3PointsOfRotatedRect(w, h, angleDeg, offsetX = 0, offsetY = 0) {
    // Základní tři rohy: p1, p2, p3
    // p1 = (0,0), p2 = (w,0), p3 = (0,h)
    const p1 = { x: 0, y: 0 };
    const p2 = { x: w, y: 0 };
    const p3 = { x: 0, y: h };

    // Úhel ve stupních => radiány
    const rad = (angleDeg * Math.PI) / 180;

    // Pomocná funkce pro otočení bodu p kolem (0,0) o rad
    const rotate = (p) => ({
        x: p.x * Math.cos(rad) - p.y * Math.sin(rad),
        y: p.x * Math.sin(rad) + p.y * Math.cos(rad),
    });

    // Otočíme body
    const rp1 = rotate(p1);
    const rp2 = rotate(p2);
    const rp3 = rotate(p3);

    // Posuneme je o (offsetX, offsetY)
    rp1.x += offsetX; rp1.y += offsetY;
    rp2.x += offsetX; rp2.y += offsetY;
    rp3.x += offsetX; rp3.y += offsetY;

    return [rp1, rp2, rp3];
}

const anglesToTest = [0, 30, 45, 60, 90, 135, 210, 330];
anglesToTest.forEach((testAngle) => {
    // Vygenerujeme tři body obdélníku o šířce 100, výšce 50
    const [p1, p2, p3] = generate3PointsOfRotatedRect(100, 50, testAngle);

    // Spočítáme OBB z těchto tří bodů
    const { angle, width, height, center, corners } = computeOBBFrom3Points(p1, p2, p3);

    console.log("\n=== Test úhlu:", testAngle, "° ===");
    console.log("Vstupní body:");
    console.log(" p1 =", p1, "\n p2 =", p2, "\n p3 =", p3);
    console.log("=> Výstup funkce computeOBBFrom3Points:");
    console.log("   angle =", angle.toFixed(2), "°");
    console.log("   width =", width.toFixed(2));
    console.log("   height =", height.toFixed(2));
    console.log("   center =", center);
    console.log("   corners =", corners);
});

