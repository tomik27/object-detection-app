import DirectoryPicker from "../Common/DirectoryPicker.jsx";
import PropTypes from "prop-types";
import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import ClassManagerModal from "../Train/ClassManagerModal.jsx";
import yaml from "js-yaml";
import {useRef} from "react";

const ValidationForm = ({
                            selectedModel,
                            setSelectedModel,
                            trainingRuns,
                            selectedTrainingRun,
                            setSelectedTrainingRun,
                            validationParams, // combined object: { imageSize, sourceDirectory, classes, confidenceThreshold, iouThreshold }
                            setValidationParams,
                            handleSourceFolderSelection,
                            onValidate,
                        }) => {
    const fileInputRef = useRef(null);

    const handleYamlButtonClick = () => {
        fileInputRef.current.click();
    };

    // YAML file upload handler:
    const handleYamlUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = yaml.load(event.target.result);

                if (data.val) {
                    setValidationParams((prev) => ({
                        ...prev,
                        sourceDirectory: data.val
                    }));
                } else {
                    console.error("YAML file does not contain the required keys: val.");
                }
            } catch (err) {
                console.error("Error parsing YAML:", err);
            }
        };
        reader.readAsText(file);
    };

    // Destructure values from validationParams.
    const {imageSize, sourceDirectory, classes, confidenceThreshold, iouThreshold} = validationParams;

    // Validate individual parameters.
    const isConfidenceValid = confidenceThreshold >= 0 && confidenceThreshold <= 1;
    const isIouValid = iouThreshold >= 0 && iouThreshold <= 1;
    const isImageSizeValid = Number(imageSize) > 0;
    const isFormValid = isConfidenceValid && isIouValid && isImageSizeValid;
    const hasClasses = Array.isArray(classes) && classes.length > 0;

    const classText =
        hasClasses ? classes.join(", ").substring(0, 70) + "..." : "Please add at least one class.";
    const updateClasses = (updateFnOrArray) => {
        setValidationParams((prev) => ({
            ...prev,
        }));
    };

    return (
        <Box component="form" noValidate autoComplete="off">
            <Stack spacing={2}>

                <Stack spacing={2}>
                    <Button variant="outlined" onClick={handleYamlButtonClick}>
                        Load YAML file
                    </Button>
                    <input
                        type="file"
                        accept=".yaml,.yml"
                        style={{display: "none"}}
                        ref={fileInputRef}
                        onChange={handleYamlUpload}
                    />
                </Stack>
                <Divider />

                {/* Row 1: Model and Training Run selection */}
                <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
                    <TextField
                        label="Model"
                        select
                        fullWidth
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        <MenuItem value="YOLOv5">YOLOv5</MenuItem>
                        <MenuItem value="YOLOv7">YOLOv7</MenuItem>
                    </TextField>
                    <FormControl fullWidth>
                        <InputLabel id="training-run-label">Training Run</InputLabel>
                        <Select
                            labelId="training-run-label"
                            value={selectedTrainingRun}
                            label="Training Run"
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

                <Divider />

                <DirectoryPicker
                    label="Validation Data"
                    directory={sourceDirectory}
                    onSelect={handleSourceFolderSelection}
                />

                <Divider />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                        label="Confidence threshold"
                        type="number"
                        fullWidth
                        value={confidenceThreshold}
                        onChange={(e) =>
                            setValidationParams((prev) => ({
                                ...prev,
                                confidenceThreshold: e.target.value,
                            }))
                        }
                    />
                    <TextField
                        label="IOU threshold"
                        type="number"
                        fullWidth
                        value={iouThreshold}
                        onChange={(e) =>
                            setValidationParams((prev) => ({
                                ...prev,
                                iouThreshold: e.target.value,
                            }))
                        }
                    />
                    <TextField
                        label="Image size"
                        type="number"
                        fullWidth
                        value={imageSize}
                        onChange={(e) =>
                            setValidationParams((prev) => ({
                                ...prev,
                                imageSize: Number(e.target.value),
                            }))
                        }
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>

                <Divider />

                <Stack direction="row" spacing={2} alignItems="center">
                    <ClassManagerModal classes={classes} setClasses={updateClasses} />
                    <Typography>{classText}</Typography>
                </Stack>


                {/* Row 5: Validation button */}
                <Button variant="contained" fullWidth onClick={onValidate} disabled={!isFormValid}>
                    Start Validation
                </Button>
            </Stack>
        </Box>
    );
};

ValidationForm.propTypes = {
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
    validationParams: PropTypes.shape({
        imageSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        sourceDirectory: PropTypes.string.isRequired,
        classes: PropTypes.arrayOf(PropTypes.string).isRequired,
        confidenceThreshold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        iouThreshold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }).isRequired,
    setValidationParams: PropTypes.func.isRequired,
    handleSourceFolderSelection: PropTypes.func.isRequired,
    onValidate: PropTypes.func.isRequired,
};

export default ValidationForm;
