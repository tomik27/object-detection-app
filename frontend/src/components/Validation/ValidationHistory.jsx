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

const ValidationScreen = () => {
    const [validationRuns, setValidationRuns] = useState([]);
    const [modelsList] = useState(["yolov5", "yolov7"]);
    const [selectedValidation, setSelectedValidation] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [validationData, setValidationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch validations for the selected model
    useEffect(() => {
        async function fetchValidationRuns() {
            try {
                const response = await fetch(
                    `/api/validation/list?model=${selectedModel || "yolov5"}`
                );
                if (!response.ok) {
                    throw new Error("Error fetching validations");
                }
                const runs = await response.json();
                setValidationRuns(runs);
                if (runs.length > 0 && !selectedValidation) {
                    setSelectedValidation(runs[0].id);
                }
            } catch (err) {
                console.error("Error fetching validations:", err);
                setError(err.message);
            }
        }
        fetchValidationRuns();
    }, [selectedModel, selectedValidation]);

    // Nastavení výchozího modelu, pokud ještě není vybrán
    useEffect(() => {
        if (!selectedModel && modelsList.length > 0) {
            setSelectedModel(modelsList[0]);
        }
    }, [modelsList, selectedModel]);

    // Načtení detailních dat validace pro vybraný běh a model
    useEffect(() => {
        if (!selectedValidation || !selectedModel) return;
        async function fetchValidationData() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `/api/validation/get?experiment=${selectedValidation}&model=${selectedModel}`
                );
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || response.statusText);
                }
                const data = await response.json();
                setValidationData(data);
            } catch (err) {
                console.error("Error fetching validation data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchValidationData();
    }, [selectedValidation, selectedModel]);

    const renderImageCard = (imageUrl, title) => (
        <Box key={title}>
            <Card>
                <CardMedia component="img" height="300" image={imageUrl} alt={title} />
                <CardContent>
                    <Typography variant="body2" align="center">
                        {title}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
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
                    margin: "0 auto",
                }}
            >
                <Typography variant="h5" gutterBottom align="center">
                    Validation History
                </Typography>

                {/* Model and validation run selection */}
                <Box sx={{display: "flex", gap: 2, mb: 2}}>
                    <FormControl sx={{width: "50%"}}>
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
                    <FormControl sx={{ width: "50%" }}>
                        <InputLabel id="validation-run-select-label">
                            Choose Validation Run
                        </InputLabel>
                        <Select
                            labelId="validation-run-select-label"
                            value={selectedValidation}
                            label="Choose Validation Run"
                            onChange={(e) => setSelectedValidation(e.target.value)}
                        >
                            {validationRuns.map((run) => (
                                <MenuItem key={run.id} value={run.id}>
                                    {run.name} ({run.timestamp})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {error && (
                    <Typography variant="body1" color="error" align="center">
                        {error}
                    </Typography>
                )}

                {validationData && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        {validationData.confusion_matrix_url &&
                            renderImageCard(validationData.confusion_matrix_url, "Confusion Matrix")}
                        {validationData.f1_curve_url &&
                            renderImageCard(validationData.f1_curve_url, "F1 Curve")}
                        {validationData.pr_curve_url &&
                            renderImageCard(validationData.pr_curve_url, "PR Curve")}
                        {(!validationData.confusion_matrix_url &&
                            !validationData.f1_curve_url) && (
                            <Box sx={{ gridColumn: "span 2", textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Evaluation images are not available.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default ValidationScreen;
