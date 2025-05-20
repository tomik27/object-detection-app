import {useEffect, useState} from "react";
import {Box, Divider, Paper, Typography} from "@mui/material";
import ValidationForm from "./ValidationForm";

const Validation = () => {
    const [selectedModel, setSelectedModel] = useState("YOLOv5");
    const [trainingRuns, setTrainingRuns] = useState([]);
    const [selectedTrainingRun, setSelectedTrainingRun] = useState("");

    // Combined validation parameters.
    const [validationParams, setValidationParams] = useState({
        imageSize: 640,
        sourceDirectory: "",
        classes: [],
        confidenceThreshold: 0.25,
        iouThreshold: 0.5,
    });

    // Validation process states.
    const [validationStatus, setValidationStatus] = useState("idle"); // "idle", "pending", "completed", "error"
    const [currentExperiment, setCurrentExperiment] = useState(null);
    const [validationMetrics, setValidationMetrics] = useState(null);
    const [error, setError] = useState(null);
    const [validationMessage, setValidationMessage] = useState("");

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

    // Fetch experiment data and update training parameters.
    useEffect(() => {
        async function fetchExperimentData() {
            if (!selectedTrainingRun) return;
            try {
                const response = await fetch(
                    `/api/training/getData?model=${selectedModel}&experiment=${selectedTrainingRun}`
                );
                if (!response.ok) throw new Error("Error fetching experiment data");
                const data = await response.json();
                setValidationParams((prev) => ({
                    ...prev,
                    imageSize: data.img_size,
                    sourceDirectory: data.val,
                    classes: Array.isArray(data.classes) ? data.classes : [] // Vždy pole
                }));
            } catch (err) {
                console.error("Error fetching experiment data:", err);
            }
        }
        fetchExperimentData();
    }, [selectedTrainingRun, selectedModel]);

    // Polling for latest validation results (images) and update message.
    useEffect(() => {
        let intervalId;
        if (validationStatus === "pending" && currentExperiment) {
            intervalId = setInterval(async () => {
                try {
                    const response = await fetch(
                        `/api/validation/latest-results?experiment=${currentExperiment}&model=${selectedModel}`
                    );
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || response.statusText);
                    }
                    const data = await response.json();
                    // If images are available, we assume validation is complete.
                    if (data?.images && data.images.length > 0) {
                        setValidationMetrics(data.images);
                        setValidationStatus("completed");
                        setValidationMessage(
                            "Validation completed successfully. Please check the history of validation results."
                        );
                        clearInterval(intervalId);
                    }
                } catch (err) {
                    console.error("Error fetching latest validation images:", err);
                    setError(err.message);
                    setValidationStatus("error");
                    setValidationMessage("Validation failed. Please see the error message below.");
                    clearInterval(intervalId);
                }
            }, 3000); // poll every 3 seconds
        }
        return () => clearInterval(intervalId);
    }, [validationStatus, currentExperiment]);

    // Handler for selecting a new validation folder via prompt.
    const handleSourceFolderSelection = () => {
        const folderPath = prompt("Enter path to validation directory");
        if (folderPath) {
            setValidationParams((prev) => ({
                ...prev,
                sourceDirectory: folderPath,
            }));
        }
    };

    const handleValidate = async () => {
        if (!validationParams.sourceDirectory || !selectedTrainingRun) {
            alert("Please select an image folder, ground truth folder, and training model first.");
            return;
        }
        const payload = {
            source: validationParams.sourceDirectory,
            model: selectedModel,
            trainingRun: selectedTrainingRun,
            confidence: validationParams.confidenceThreshold,
            iou: validationParams.iouThreshold,
            imageSize: validationParams.imageSize,
            classList: validationParams.classes,
        };

        setValidationStatus("pending");
        setValidationMetrics(null);
        setCurrentExperiment(null);
        setError(null);
        setValidationMessage("");

        try {
            const response = await fetch("/api/validation", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
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
            console.error("Error starting validation:", err);
            setError(err.message);
            setValidationStatus("error");
        }
    };

    async function extractErrorMessage(response) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            return errorData.error || text || response.statusText;
        } catch (error) {
            return text || response.statusText || "Unknown error";
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
                     Validation
                </Typography>
                <Divider sx={{mb: 3}}/>

                <ValidationForm
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    trainingRuns={trainingRuns}
                    selectedTrainingRun={selectedTrainingRun}
                    setSelectedTrainingRun={setSelectedTrainingRun}
                    validationParams={validationParams} // Combined parameters including thresholds.
                    setValidationParams={setValidationParams}
                    handleSourceFolderSelection={handleSourceFolderSelection}
                    onValidate={handleValidate}
                />

                {currentExperiment && (
                    <Typography variant="body1" textAlign="center" sx={{mt: 2}}>
                        Validation result is stored in folder: {currentExperiment}
                    </Typography>
                )}

                {validationStatus === "pending" && (
                    <Typography variant="body1" textAlign="center" sx={{mt: 2}}>
                        Validation in progress, please wait...
                    </Typography>
                )}

                {validationStatus === "completed" && (
                    <Typography variant="body1" color="primary" textAlign="center" sx={{mt: 2}}>
                        {validationMessage}
                    </Typography>
                )}
                {validationStatus === "error" && (
                    <Typography variant="h6" color="error" textAlign="center" sx={{mt: 2}}>
                        Error: {error}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default Validation;
