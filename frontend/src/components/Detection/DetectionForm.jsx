import {
    Box,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    TextField,
    Typography, Divider,
} from "@mui/material";
import PropTypes from "prop-types";

const DetectionForm = ({
                           selectedModel,
                           setSelectedModel,
                           trainingRuns,
                           selectedTrainingRun,
                           setSelectedTrainingRun,
                           sourceDirectory,
                           confidenceThreshold,
                           setConfidenceThreshold,
                           iouThreshold,
                           setIouThreshold,
                           imageSize,
                           setImageSize,
                           handleFolderSelection,
                           onDetect,
                       }) => {
    // Validate threshold values:
    const isConfidenceValid = confidenceThreshold >= 0 && confidenceThreshold <= 1;
    const isIouValid = iouThreshold >= 0 && iouThreshold <= 1;
    const isImageSizeValid = imageSize > 0;

    // Overall form validity
    const isFormValid = isConfidenceValid && isIouValid && isImageSizeValid;

    return (
        <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>Model</InputLabel>
                    <Select
                        value={selectedModel}
                        label="Model"
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        <MenuItem value="YOLOv5">YOLOv5</MenuItem>
                        <MenuItem value="yolov7">YOLOv7</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth>
                    <InputLabel>Training Model</InputLabel>
                    <Select
                        value={selectedTrainingRun}
                        label="Training Model"
                        onChange={(e) => setSelectedTrainingRun(e.target.value)}
                    >
                        {trainingRuns.map((run) => (
                            <MenuItem key={run.id} value={run.id}>
                                {run.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                    label="Confidence Threshold"
                    type="number"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    fullWidth
                    inputProps={{step: 0.05, min: 0, max: 1}}
                    error={!isConfidenceValid}
                    helperText={!isConfidenceValid ? "Value must be between 0 and 1." : ""}
                />
                <TextField
                    label="IoU Threshold"
                    type="number"
                    value={iouThreshold}
                    onChange={(e) => setIouThreshold(Number(e.target.value))}
                    fullWidth
                    inputProps={{step: 0.05, min: 0, max: 1}}
                    error={!isIouValid}
                    helperText={!isIouValid ? "Value must be between 0 and 1." : ""}
                />
                <TextField
                    label="Image Size"
                    type="number"
                    value={imageSize}
                    onChange={(e) => setImageSize(Number(e.target.value))}
                    fullWidth
                    error={!isImageSizeValid}
                    helperText={!isImageSizeValid ? "Value must be greater than 0." : ""}
                />
            </Stack>
            <Divider sx={{my: 3}}/>

            <Box sx={{ mb: 3, textAlign: "center" }} >
                <Button variant="contained" size="medium" onClick={handleFolderSelection}>
                    Select Folder
                </Button>
                <Typography variant="body2" sx={{ mt: 1 }}>
                    {sourceDirectory
                        ? `Selected folder: ${sourceDirectory}`
                        : "No folder selected"}
                </Typography>
            </Box>
            <Divider sx={{my: 3}}/>

            <Box sx={{textAlign: "center", mb: 3}}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={onDetect}
                    disabled={!isFormValid}
                >
                    Start Detection
                </Button>
            </Box>
        </Box>
    );
};

DetectionForm.propTypes = {
    selectedModel: PropTypes.string.isRequired,
    setSelectedModel: PropTypes.func.isRequired,
    trainingRuns: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    selectedTrainingRun: PropTypes.string.isRequired,
    setSelectedTrainingRun: PropTypes.func.isRequired,
    sourceDirectory: PropTypes.string.isRequired,
    confidenceThreshold: PropTypes.number.isRequired,
    setConfidenceThreshold: PropTypes.func.isRequired,
    iouThreshold: PropTypes.number.isRequired,
    setIouThreshold: PropTypes.func.isRequired,
    imageSize: PropTypes.number.isRequired,
    setImageSize: PropTypes.func.isRequired,
    handleFolderSelection: PropTypes.func.isRequired,
    onDetect: PropTypes.func.isRequired,
};

export default DetectionForm;
