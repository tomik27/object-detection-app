import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import DetectionResults from "./DetectionResults";

const DetectionHistory = () => {
    const modelsList = ["yolov5", "yolov7"];
    const [selectedModel, setSelectedModel] = useState(modelsList[0]);
    const [detectionRuns, setDetectionRuns] = useState([]);
    const [selectedRun, setSelectedRun] = useState("");
    const [detectionData, setDetectionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        async function fetchDetectionRuns() {
            try {
                const response = await fetch(
                    `/api/detection/list?model=${selectedModel}`
                );
                if (!response.ok) {
                    throw new Error("Error fetching detection runs");
                }
                const runs = await response.json();
                setDetectionRuns(runs);
                if (runs.length > 0) {
                    setSelectedRun(runs[0].id);
                }
            } catch (err) {
                console.error("Error fetching detection runs:", err);
                setError(err.message);
            }
        }
        fetchDetectionRuns();
    }, [selectedModel]);

    useEffect(() => {
        if (!selectedRun || !selectedModel) return;
        async function fetchDetectionData() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/detection/get?experiment=${selectedRun}&model=${selectedModel}`
                );
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || response.statusText);
                }
                const data = await response.json();
                setDetectionData(data);
                setCurrentImageIndex(0);
            } catch (err) {
                console.error("Error fetching detection results:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetectionData();
    }, [selectedRun, selectedModel]);

    const nextImage = () => {
        if (
            detectionData &&
            detectionData.images &&
            currentImageIndex < detectionData.images.length - 1
        ) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    const prevImage = () => {
        if (detectionData && detectionData.images && currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

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
                    minWidth: "300px",
                    alignItems: "center",
                    margin: "0 auto",
                }}
            >
                <Typography variant="h5" gutterBottom align="center">
                    Detection Results
                </Typography>
                {/* Model and detection run selection */}
                <Box sx={{display: "flex", gap: 2, mb: 2}}>
                    <FormControl sx={{width: "50%"}}>
                        <InputLabel id="model-select-label">Select Model</InputLabel>
                        <Select
                            labelId="model-select-label"
                            value={selectedModel}
                            label="Select Model"
                            onChange={(e) => {
                                setSelectedModel(e.target.value);
                                setSelectedRun("");
                                setDetectionData(null);
                            }}
                        >
                            {modelsList.map((model) => (
                                <MenuItem key={model} value={model}>
                                    {model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{ width: "50%" }}>
                        <InputLabel id="run-select-label">
                            Select Detection Run
                        </InputLabel>
                        <Select
                            labelId="run-select-label"
                            value={selectedRun}
                            label="Select Detection Run"
                            onChange={(e) => setSelectedRun(e.target.value)}
                        >
                            {detectionRuns.map((run) => (
                                <MenuItem key={run.id} value={run.id}>
                                    {run.name} ({run.timestamp})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {error && (
                    <Typography variant="body1" color="error" align="center" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                {loading && (
                    <Typography variant="body1" align="center" sx={{mb: 2}}>
                        Loading...
                    </Typography>
                )}

                {detectionData &&
                    detectionData.images &&
                    detectionData.images.length > 0 && (
                        <DetectionResults
                            currentExperiment={selectedRun}
                            detectResultImages={detectionData.images}
                            currentImageIndex={currentImageIndex}
                            nextImage={nextImage}
                            prevImage={prevImage}
                        />
                    )}
            </Paper>
        </Box>
    );
};

export default DetectionHistory;
