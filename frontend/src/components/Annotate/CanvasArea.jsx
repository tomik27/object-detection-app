import { useRef, useEffect } from "react";
import { Box } from "@mui/material";
import { denormalize } from "./utils";

export default function CanvasArea({
                                       image,
                                       annotations,
                                       currentPoints,
                                       onCanvasClick,
                                   }) {
    const canvasRef = useRef(null);

    const handleCanvasClick = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width;
        const y = (event.clientY - rect.top) / canvas.height;

        onCanvasClick({ x, y, canvas });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const container = canvas.parentElement;
        if (!container) return;

        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = image;

        img.onload = () => {
            // Zjistíme originální rozměry obrázku
            const originalWidth = img.width;
            const originalHeight = img.height;
            const aspectRatio = originalHeight / originalWidth;

            // Šířka, kterou máme k dispozici v kontejneru
            const containerWidth = container.clientWidth;

            // Volitelně: pokud je originální obrázek menší než containerWidth,
            // můžete buď zvětšit, nebo nechat menší. Zde ho roztáhneme max do containerWidth.
            let newWidth = Math.min(containerWidth, originalWidth);
            let newHeight = newWidth * aspectRatio;

            // Nastavíme reálné rozměry <canvas>
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Vykreslíme obrázek do canvasu se zachováním poměru
            ctx.clearRect(0, 0, newWidth, newHeight);
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Vykreslení existujících anotací
            annotations.forEach((ann) => {
                if (!ann.corners) return;
                const corners = ann.corners.map((c) => denormalize(c.x, c.y, canvas));
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                for (let i = 1; i < corners.length; i++) {
                    ctx.lineTo(corners[i].x, corners[i].y);
                }
                ctx.closePath();
                ctx.strokeStyle = "blue";
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // Vykreslení aktuálních bodů
            currentPoints.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "green";
                ctx.fill();
            });
        };
    }, [image, annotations, currentPoints]);

    return (
        <Box
            sx={{
                width: "90vw",
                maxWidth: "1200px",
                margin: "0 auto",
                mt: 2,
                border: "1px solid #ddd",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", cursor: "crosshair" }}
                onClick={handleCanvasClick}
            />
        </Box>
    );
}

