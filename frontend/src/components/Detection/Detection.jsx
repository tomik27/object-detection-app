import { useState, useEffect } from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import DetectionForm from "./DetectionForm";
import DetectionResults from "./DetectionResults";

const Detection = () => {
    const [selectedModel, setSelectedModel] = useState("YOLOv5");
    const [trainingRuns, setTrainingRuns] = useState([]);
    const [selectedTrainingRun, setSelectedTrainingRun] = useState("");
    const [sourceDirectory, setSourceDirectory] = useState("");
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
    const [iouThreshold, setIouThreshold] = useState(0.45);
    const [imageSize, setImageSize] = useState(640);

    const [detectionStatus, setDetectionStatus] = useState("idle"); // "idle", "pending", "completed", "error"
    const [currentExperiment, setCurrentExperiment] = useState(null);
    const [detectResultImages, setDetectResultImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchTrainingRuns() {
            try {
                const response = await fetch(`/api/training/list?model=${selectedModel}`);
                if (!response.ok) {
                    throw new Error("Error fetching training runs");
                }
                const runs = await response.json();
                setTrainingRuns(runs);
                if (runs.length > 0) {
                    setSelectedTrainingRun(runs[0].id);
                }
            } catch (err) {
                console.error("Error fetching training runs:", err);
            }
        }
        if (selectedModel) {
            fetchTrainingRuns();
        }
    }, [selectedModel]);

    // Polling mechanism to fetch detection results for the current experiment.
    useEffect(() => {
        if (detectionStatus === "pending" && currentExperiment) {
            const intervalId = setInterval(async () => {
                try {
                    const response = await fetch(
                        `/api/detection/latest?experiment=${currentExperiment}&model=${selectedModel}`
                    );
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || response.statusText);
                    }
                    const data = await response.json();
                    if (data?.images && data.images.length > 0) {
                        setDetectResultImages(data.images);
                        setCurrentImageIndex(0);
                        setDetectionStatus("completed");
                        clearInterval(intervalId);
                    }
                } catch (err) {
                    console.error("Error fetching latest images:", err);
                    setError(err.message);
                    setDetectionStatus("error");
                    clearInterval(intervalId);
                }
            }, 3000); // Polling every 3 seconds
            return () => clearInterval(intervalId);
        }
    }, [detectionStatus, currentExperiment, selectedModel]);

    const nextImage = () => {
        setCurrentImageIndex((prevIndex) =>
            (prevIndex + 1) % detectResultImages.length
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) =>
            (prevIndex - 1 + detectResultImages.length) % detectResultImages.length
        );
    };

    const handleFolderSelection = () => {
        const folderPath = prompt("Enter path to data directory");
        if (folderPath) {
            setSourceDirectory(folderPath);
        }
    };

    const handleDetect = async () => {
        if (!sourceDirectory || !selectedTrainingRun) {
            alert("Please select a folder and a training model first.");
            return;
        }

        const formData = new FormData();
        formData.append("source", sourceDirectory);
        formData.append("model", selectedModel);
        formData.append("trainingRun", selectedTrainingRun);
        formData.append("confidence", confidenceThreshold);
        formData.append("iou", iouThreshold);
        formData.append("imageSize", imageSize);

        setDetectionStatus("pending");
        setDetectResultImages([]);
        setCurrentExperiment(null);
        setError(null);

        try {
            const response = await fetch("/api/detection", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const errorMessage = await extractErrorMessage(response);
                throw new Error(errorMessage);
            }
            const data = await response.json();
            if (data.experiment) {
                setCurrentExperiment(data.experiment);
            } else {
                throw new Error("Experiment identifier not returned");
            }
        } catch (err) {
            console.error("Chyba při spuštění detekce:", err);
            setError(err.message);
            setDetectionStatus("error");
        }
    };

    // Helper function to extract error messages from response
    async function extractErrorMessage(response) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            return errorData.error || text || response.statusText;
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            return text || response.statusText || "Unknown error occurred";
        }
    }

    return (
        <Box
            sx={{
                p: 3,
                backgroundColor: "#f4f6f8",
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    width: "80vw",
                    maxWidth: "90%",
                    minWidth: "600px",
                }}
            >
                <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
                    Detection
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <DetectionForm
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    trainingRuns={trainingRuns}
                    selectedTrainingRun={selectedTrainingRun}
                    setSelectedTrainingRun={setSelectedTrainingRun}
                    sourceDirectory={sourceDirectory}
                    setSourceDirectory={setSourceDirectory}
                    confidenceThreshold={confidenceThreshold}
                    setConfidenceThreshold={setConfidenceThreshold}
                    iouThreshold={iouThreshold}
                    setIouThreshold={setIouThreshold}
                    imageSize={imageSize}
                    setImageSize={setImageSize}
                    handleFolderSelection={handleFolderSelection}
                    onDetect={handleDetect}
                />

                {/* Display detection status and error message */}
                {detectionStatus === "pending" && (
                    <Typography variant="body1" textAlign="center" sx={{mt: 2}}>
                        Detection in progress, please wait...
                    </Typography>
                )}
                {detectionStatus === "error" && (
                    <Typography variant="h6" color="error" textAlign="center" sx={{mt: 2}}>
                        Error: {error}
                    </Typography>
                )}

                {detectionStatus === "completed" && detectResultImages.length > 0 && (
                    <DetectionResults
                        currentExperiment={currentExperiment}
                        detectResultImages={detectResultImages}
                        currentImageIndex={currentImageIndex}
                        nextImage={nextImage}
                        prevImage={prevImage}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default Detection;
