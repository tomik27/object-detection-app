import {useRef, useState} from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Divider,
    FormControl, FormControlLabel, InputLabel, MenuItem, Select,
    Stack, Switch, TextField,
    Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DirectoryPicker from "../Common/DirectoryPicker.jsx";
import yaml from "js-yaml";
import PropTypes from "prop-types";
import NumberInput from "../Common/NumberInput.jsx";
import ModelWeightsSelect from "./ModelWeightsSelect.jsx";
import ClassManagerModal from "./ClassManagerModal.jsx";

const TrainingForm = ({
                          trainingParams,    // { imageSize, setImageSize, batchSize, setBatchSize, epochs, setEpochs, optimizer, setOptimizer, cosineScheduler, setCosineScheduler, device, setDevice }
                          directories,    // { data, val, selectData, selectVal }
                          models,         // { selected, setSelected, list }
                          weights,        // { selected, setSelected, list }
                          classState,
                          onTrain,
                          onStop,
                          isProcessing,
                          trainingRuns
                      }) => {
    const [expanded, setExpanded] = useState(true);
    const fileInputRef = useRef(null);

    const {
        imageSize,
        batchSize,
        epochs,
        optimizer,
        setOptimizer,
        cosineScheduler,
        setCosineScheduler,
        device,
        setDevice
    } = trainingParams;
    const handleAccordionChange = () => setExpanded(!expanded);

    // Load YAML file
    const handleYamlButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleYamlUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = yaml.load(event.target.result);
                if (data.train && data.val && data.names) {
                    const root = data.path ? data.path.replace(/\\/g, '/') : null;
                    const isAbsolute = (p) =>
                        /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('/');
                    const joinPath = (base, rel) => {
                        if (!base || isAbsolute(rel)) return rel;
                        const cleanBase = base.replace(/[\\/]+$/, '');
                        const cleanRel = rel.replace(/^[\\/]+/, '');
                        return `${cleanBase}/${cleanRel}`;
                    };

                    // If path exists
                    const trainPath = root ? joinPath(root, data.train) : data.train;
                    const valPath = root ? joinPath(root, data.val) : data.val;

                    directories.selectData(trainPath);
                    directories.selectVal(valPath);

                    const classesArray = Array.isArray(data.names)
                        ? data.names
                        : Object.values(data.names);
                    classState.setClasses(classesArray);
                } else {
                    console.error(
                        "YAML file does not contain the required keys: train, val, names."
                    );
                }
            } catch (err) {
                console.error("Error parsing YAML:", err);
            }
        };
        reader.readAsText(file);
    };
    // Numeric validations: all values must be greater than 0.
    const isImageSizeValid = imageSize > 0;
    const isBatchSizeValid = batchSize > 0;
    const isEpochsValid = epochs > 0;
    const areNumericParamsValid = isImageSizeValid && isBatchSizeValid && isEpochsValid;

    const hasWeight = Boolean(weights.selected);
    const hasTrainingData = Boolean(directories.data);
    const hasValidationData = Boolean(directories.val);
    const hasClasses = Boolean(classState.classes && classState.classes.length > 0);
    const classText =
        hasClasses ? classState.classes.join(", ").substring(0, 40) + "..." : "Please add at least one class.";

    // Overall Form Validation
    const isFormValid =
        areNumericParamsValid && hasTrainingData && hasValidationData && hasClasses && hasWeight;

    return (
        <Box>
            <Accordion expanded={expanded} onChange={handleAccordionChange}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="h6">Training Parameters</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={3}>
                        {/* Training parameters (numeric inputs) */}
                        <Stack direction={{xs: "column", md: "row"}} spacing={2}>
                            <NumberInput
                                label="Image Size"
                                value={trainingParams.imageSize}
                                onChange={trainingParams.setImageSize}
                                min={1}
                                step={1}
                                error={!isImageSizeValid}
                                helperText="Value must be greater than 0."
                            />
                            <NumberInput
                                label="Batch Size"
                                value={trainingParams.batchSize}
                                onChange={trainingParams.setBatchSize}
                                min={1}
                                step={1}
                                error={!isBatchSizeValid}
                                helperText="Value must be greater than 0."
                            />
                            <NumberInput
                                label="Epochs"
                                value={trainingParams.epochs}
                                onChange={trainingParams.setEpochs}
                                min={1}
                                step={1}
                                error={!isEpochsValid}
                                helperText="Value must be greater than 0."
                            />
                        </Stack>

                        {/* Model and weights selection */}
                        <Stack direction={{xs: "column", md: "row"}} spacing={2}>
                            <ModelWeightsSelect models={models} weights={weights} trainingRuns={trainingRuns} />
                        </Stack>

                        <Divider/>

                        {/* Directory selection and class management */}
                        <Stack direction={{xs: 'column', md: 'row'}} spacing={2}>
                            <Stack spacing={2} flex={1} sx={{minWidth: 0}}>
                                <Typography variant="h6">Files</Typography>
                                <Stack direction={{xs: 'column', md: 'row'}} spacing={4}>
                                    <DirectoryPicker
                                        label="Training Data"
                                        directory={directories.data}
                                        onSelect={directories.selectData}
                                    />
                                    <DirectoryPicker
                                        label="Validation Data"
                                        directory={directories.val}
                                        onSelect={directories.selectVal}
                                    />
                                </Stack>
                                {!hasTrainingData && (
                                    <Typography color="error">Please select a Training Data folder.</Typography>
                                )}
                                {!hasValidationData && (
                                    <Typography color="error">Please select a Validation Data folder.</Typography>
                                )}
                            </Stack>
                            <Divider orientation="vertical" flexItem />
                            <Stack spacing={2} flex={1} sx={{minWidth: 0}}>
                                <Typography variant="h6">Class modal</Typography>
                                <Stack direction={{xs: 'column', md: 'row'}} spacing={4} justifyContent="center">
                                    <ClassManagerModal classes={classState.classes} setClasses={classState.setClasses}/>
                                    <Typography variant="body2">{classText}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
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
                        <Divider sx={{my: 3}}/>

                        {/* Optional Parameters Section */}
                        <Typography variant="h6">Optional Parameters</Typography>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                                <TextField
                                    label="Device"
                                    type="text"
                                    value={device}
                                    onChange={e => setDevice(e.target.value)}
                                    helperText="e.g. 'cpu' or '0,1' for GPU IDs"
                                    fullWidth
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Optimizer</InputLabel>
                                    <Select
                                        value={optimizer}
                                        label="Optimizer"
                                        onChange={e => setOptimizer(e.target.value)}
                                    >
                                        <MenuItem value="SGD">SGD</MenuItem>
                                        <MenuItem value="AdamW">AdamW</MenuItem>
                                        <MenuItem value="">EMPTY</MenuItem>

                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={<Switch
                                        checked={cosineScheduler}
                                        onChange={(_, v) => setCosineScheduler(v)}
                                    />}
                                    label="Cosine LR"
                                    sx={{ width: '100%' }}
                                />
                        </Stack>

                        <Divider sx={{my: 3}}/>
                        {/* Buttons for starting and stopping training */}
                        <Stack direction="row" spacing={3} justifyContent="center">
                            <Button
                                variant="contained"
                                color="success"
                                onClick={onTrain}
                                disabled={isProcessing || !isFormValid}
                                sx={{minWidth: 200}}
                            >
                                Start Training
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={onStop}
                                disabled={!isProcessing}
                                sx={{minWidth: 200}}
                            >
                                Stop Process
                            </Button>
                        </Stack>
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

TrainingForm.propTypes = {
    trainingParams: PropTypes.shape({
        imageSize: PropTypes.number.isRequired,
        setImageSize: PropTypes.func.isRequired,
        batchSize: PropTypes.number.isRequired,
        setBatchSize: PropTypes.func.isRequired,
        epochs: PropTypes.number.isRequired,
        setEpochs: PropTypes.func.isRequired,
    }).isRequired,
    directories: PropTypes.shape({
        data: PropTypes.string,
        val: PropTypes.string,
        selectData: PropTypes.func.isRequired,
        selectVal: PropTypes.func.isRequired,
    }).isRequired,
    models: ModelWeightsSelect.propTypes.models,
    weights: ModelWeightsSelect.propTypes.weights,
    classState: ClassManagerModal.propTypes.classState,
    onTrain: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    isProcessing: PropTypes.bool.isRequired,
};

export default TrainingForm;
