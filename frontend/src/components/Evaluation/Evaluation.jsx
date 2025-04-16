import {useEffect, useState} from "react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import ResultGraph from "./ResultGraph.jsx";

const EvaluationScreen = () => {
    const [trainingRuns, setTrainingRuns] = useState([]);
    const [modelsList] = useState(["yolov5", "yolov7", "yolov8"]); // Případně doplňte další
    const [selectedTrain, setSelectedTrain] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [evaluationData, setEvaluationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch training runs filtered by selected model
    useEffect(() => {
        async function fetchTrainingRuns() {
            try {
                const response = await fetch(`/api/training/list?model=${selectedModel || "yolov5"}`);
                if (!response.ok) {
                    throw new Error("Chyba při načítání tréninkových běhů");
                }
                const runs = await response.json();
                setTrainingRuns(runs);
                if (runs.length > 0 && !selectedTrain) {
                    setSelectedTrain(runs[0].id);
                }
            } catch (err) {
                console.error("Chyba při načítání tréninkových běhů:", err);
                setError(err.message);
            }
        }
        fetchTrainingRuns();
    }, [selectedModel, selectedTrain]);

    useEffect(() => {
        if (!selectedModel && modelsList.length > 0) {
            setSelectedModel(modelsList[0]);
        }
    }, [modelsList, selectedModel]);

    useEffect(() => {
        if (!selectedTrain || !selectedModel) return;
        async function fetchEvaluationData() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/training/get?experiment=${selectedTrain}&model=${selectedModel}`
                );
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || response.statusText);
                }
                const data = await response.json();
                setEvaluationData(data);
            } catch (err) {
                console.error("Error during evaluation:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchEvaluationData();
    }, [selectedTrain, selectedModel]);

    // Helper function to render an image card
    const renderImageCard = (imageUrl, title) => (
        <Grid item xs={12} sm={6} key={title}>
            <Card>
                <CardMedia component="img" height="300" image={imageUrl} alt={title}/>
                <CardContent>
                    <Typography variant="body2" align="center">{title}</Typography>
                </CardContent>
            </Card>
        </Grid>
    );

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
                    Training Run Evaluation
                </Typography>

                {/* Selection for model and training run */}
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <FormControl sx={{ width: "50%" }}>
                        <InputLabel id="model-select-label">Select Model</InputLabel>
                        <Select
                            labelId="model-select-label"
                            value={selectedModel}
                            label="Select Model"
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            {modelsList.map((model) => (
                                <MenuItem key={model} value={model}>
                                    {model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl sx={{width: "50%"}}>
                        <InputLabel id="train-run-select-label">Vyberte tréninkový běh</InputLabel>
                        <Select
                            labelId="train-run-select-label"
                            value={selectedTrain}
                            label="Select Training Run"
                            onChange={(e) => setSelectedTrain(e.target.value)}
                        >
                            {trainingRuns.map((run) => (
                                <MenuItem key={run.id} value={run.id}>
                                    {run.name} ({run.timestamp})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ textAlign: "center", mb: 2 }}>
                    {loading && "Loading evaluation..."}
                </Box>

                {error && (
                    <Typography variant="body1" color="error" align="center">
                        {error}
                    </Typography>
                )}

                {evaluationData && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        {evaluationData.confusion_matrix_url &&
                            renderImageCard(evaluationData.confusion_matrix_url, "Confusion Matrix")}
                        {evaluationData.f1_curve_url &&
                            renderImageCard(evaluationData.f1_curve_url, "F1 Curve")}
                        {!evaluationData.confusion_matrix_url && !evaluationData.f1_curve_url && (
                            <Box sx={{ gridColumn: "span 2", textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Evaluation images are not available.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
                <Box sx={{ width: "100%", mt: 2, display: "flex", justifyContent: "center" }}>
                        <ResultGraph experimentId={selectedTrain} model={selectedModel} />
                </Box>
            </Paper>
        </Box>
    );
};

export default EvaluationScreen;
