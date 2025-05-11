import {useState} from "react";
import {Box, Paper, Typography} from "@mui/material";
import yaml from "js-yaml";

import {computeAxisAlignedRect, computeRectFrom3PointsAnyOrder, denormalize, normalize,} from "./utils";
import CanvasArea from "./CanvasArea";
import ActionBar from "./ActionBar";
import AnnotationDialog from "./AnnotationDialog.jsx";

export default function Annotator() {
    const [datasetFiles, setDatasetFiles] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [image, setImage] = useState(null);

    // Directory handle for saving files.
    const [directoryHandle, setDirectoryHandle] = useState("");

    const [annotations, setAnnotations] = useState([]);
    const [currentPoints, setCurrentPoints] = useState([]);
    const [pendingAnnotation, setPendingAnnotation] = useState(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [angle, setAngle] = useState("0");
    const [selectedClass, setSelectedClass] = useState("");
    const [classList, setClassList] = useState(["Class 1", "Class 2"]);

    const [useAngle, setUseAngle] = useState(true);
    const handleSaveAnnotation = () => {
        if (!pendingAnnotation) {
            setIsDialogOpen(false);
            return;
        }
        const cIdx = classList.indexOf(selectedClass);
        const finalAngle = parseFloat(angle) || pendingAnnotation.angle;
        const newAnn = {
            ...pendingAnnotation,
            angle: finalAngle,
            classIndex: cIdx >= 0 ? cIdx : 0,
        };
        setAnnotations((prev) => [...prev, newAnn]);
        setPendingAnnotation(null);
        setIsDialogOpen(false);
        setAngle("0");
        setSelectedClass("");
    };

    const handleCancelAnnotation = () => {
        setPendingAnnotation(null);
        setIsDialogOpen(false);
        setAngle("0");
        setSelectedClass("");
    };
    const handleSelectDatasetFolder = (event) => {
        const folderFiles = event.target.files;
        const imageFiles = Array.from(folderFiles).filter((file) =>
            file.type.startsWith("image/")
        );
        setDatasetFiles(imageFiles);
        if (imageFiles.length > 0) {
            setImage(URL.createObjectURL(imageFiles[0]));
            setCurrentImageIndex(0);
        }
    };

    // Canvas click: Collect three points for an annotation.
    const handleCanvasClick = ({x, y, canvas}) => {
        setCurrentPoints((prev) => [...prev, {x, y}]);
        if (currentPoints.length === 2) {
            const [p1, p2] = currentPoints.map((pt) =>
                denormalize(pt.x, pt.y, canvas)
            );
            const p3 = denormalize(x, y, canvas);

            const rect = useAngle
                ? computeRectFrom3PointsAnyOrder(p1, p2, p3)
                : computeAxisAlignedRect([p1, p2, p3]);

            const {corners, center, width, height, angle} = rect;
            const normCorners = corners.map((c) => normalize(c.x, c.y, canvas));

            const tempAnn = {
                cx: center.x / canvas.width,
                cy: center.y / canvas.height,
                w: width / canvas.width,
                h: height / canvas.height,
                angle,
                corners: normCorners,
                classIndex: 0,
            };

            setPendingAnnotation(tempAnn);
            setCurrentPoints([]);
            setAngle(angle.toFixed(2));
            setSelectedClass("");
            setIsDialogOpen(true);
        }
    };

    // Change default directory.
    const handleChangeDefaultDir = async () => {
        if (!window.showDirectoryPicker) {
            alert("This browser does not support the File System Access API.");
            return;
        }
        try {
            const handle = await window.showDirectoryPicker();
            setDirectoryHandle(handle);
            alert("Default directory has been set.");
        } catch (err) {
            console.error("Folder selection failed:", err);
            alert("Failed to set folder.");
        }
    };

    // Save annotations to a TXT file.
    const saveAnnotations = async () => {
        if (!datasetFiles[currentImageIndex]) return;
        const baseName = datasetFiles[currentImageIndex].name.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.txt`;

        const content = annotations
            .map((ann) => {
                const cols = [
                    ann.classIndex || 0,
                    ann.cx.toFixed(6),
                    ann.cy.toFixed(6),
                    ann.w.toFixed(6),
                    ann.h.toFixed(6),
                ];
                if (useAngle) {
                    cols.push(ann.angle.toFixed(2));
                }
                return cols.join(" ");
            })
            .join("\n");

        if (directoryHandle) {
            try {
                const fileHandle = await directoryHandle.getFileHandle(fileName, {create: true});
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
            } catch (err) {
                console.error("Error saving file:", err);
            }
        } else {
            const blob = new Blob([content], {type: "text/plain"});
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
        }
    };

    const handleNextImage = async () => {
        await saveAnnotations();
        if (currentImageIndex + 1 < datasetFiles.length) {
            setAnnotations([]);
            const nextIndex = currentImageIndex + 1;
            setCurrentImageIndex(nextIndex);
            setImage(URL.createObjectURL(datasetFiles[nextIndex]));
        } else {
            alert("All images have been processed.");
        }
    };

    const handleClearAnnotations = () => {
        setAnnotations([]);
        setPendingAnnotation(null);
        setCurrentPoints([]);
    };

    const handleLoadClasses = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const yamlContent = e.target.result;
                const parsed = yaml.load(yamlContent);
                if (parsed && Array.isArray(parsed.names)) {
                    setClassList(parsed.names);
                    alert("Classes loaded successfully.");
                } else {
                    alert("YAML file does not contain a valid 'names' array.");
                }
            } catch (err) {
                console.error("Error parsing YAML:", err);
                alert("Error parsing YAML file.");
            }
        };
        reader.readAsText(file);
    };

    const handleToggleAngle = (e) => {
        setUseAngle(e.target.checked);
    };

    return (
        <Box
            sx={{
                p: 2,
                background: "linear-gradient(135deg, #f4f6f8 30%, #e9ecef 90%)",
                minHeight: "100vh",
            }}
        >
            <Typography variant="h5" sx={{mb: 2}}>
                Image Annotation
            </Typography>

            <ActionBar
                onSelectDataset={handleSelectDatasetFolder}
                onChangeDefaultDir={handleChangeDefaultDir}
                onLoadClasses={handleLoadClasses}
                onToggleAngle={handleToggleAngle}
                useAngle={useAngle}
                classList={classList}
                setClassList={setClassList}
                onNextImage={handleNextImage}
                onClearAnnotations={handleClearAnnotations}
            />

            {/* Canvas Area for Annotation */}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 3,
                    backgroundColor: "#ffffff",
                    boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.1)",
                    minHeight: 500,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <CanvasArea
                    image={image}
                    annotations={annotations}
                    currentPoints={currentPoints}
                    pendingAnnotation={pendingAnnotation}
                    onCanvasClick={handleCanvasClick}
                    classList={classList}
                />
            </Paper>
            <AnnotationDialog
                open={isDialogOpen}
                angle={angle}
                onChangeAngle={setAngle}
                selectedClass={selectedClass}
                onChangeClass={setSelectedClass}
                classList={classList}
                onClose={handleCancelAnnotation}
                onSave={handleSaveAnnotation}
            />
        </Box>
    );
}
