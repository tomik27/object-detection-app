import {useRef, useState} from "react";
import {Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Stack, Typography} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DirectoryPicker from "../Common/DirectoryPicker.jsx";
import yaml from "js-yaml";
import PropTypes from "prop-types";
import NumberInput from "../Common/NumberInput.jsx";
import ModelWeightsSelect from "./ModelWeightsSelect.jsx";
import ClassManagerModal from "./ClassManagerModal.jsx";

const TrainingForm = ({
                          trainingParams, // { imageSize, setImageSize, batchSize, setBatchSize, epochs, setEpochs }
                          directories,    // { data, val, selectData, selectVal }
                          models,         // { selected, setSelected, list }
                          weights,        // { selected, setSelected, list }
                          classState,     // { newClass, setNewClass }
                          onTrain,
                          onStop,
                          isProcessing,
                      }) => {
    const [expanded, setExpanded] = useState(true);
    const fileInputRef = useRef(null);

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
                 directories.selectData(data.train);
                 directories.selectVal(data.val);
                 const classesArray = Array.isArray(data.names) ? data.names : Object.values(data.names);
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
    const isImageSizeValid = trainingParams.imageSize > 0;
    const isBatchSizeValid = trainingParams.batchSize > 0;
    const isEpochsValid = trainingParams.epochs > 0;
    const areNumericParamsValid =
        isImageSizeValid && isBatchSizeValid && isEpochsValid;

  const hasTrainingData = Boolean(directories.data);
  const hasValidationData = Boolean(directories.val);
  const hasClasses = Boolean(classState.classes && classState.classes.length > 0);
    const classText =
        hasClasses ? classState.classes.join(", ").substring(0, 40) + "..." : "Please add at least one class.";


    // Overall Form Validation
    const isFormValid =
        areNumericParamsValid && hasTrainingData && hasValidationData && hasClasses;

    return (
        <Box>
            <Accordion expanded={expanded} onChange={handleAccordionChange}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="h6">Training Parameters</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={3}>
                        {/* Section for YAML file upload */}
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

                        {/* Training parameters (numeric inputs) */}
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
                            <ModelWeightsSelect models={models} weights={weights}/>
                        </Stack>

                        <Divider/>

                        {/* Directory selection and class management */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Stack spacing={2} flex={1} sx={{ minWidth: 0 }}>
                                <Typography variant="h6">Files</Typography>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
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

                            <Stack spacing={2} flex={1} sx={{ minWidth: 0 }}>
                                <Typography variant="h6">Class modal</Typography>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
                                    <ClassManagerModal classes={classState.classes} setClasses={classState.setClasses} />
                                    <Typography variant="body2">{classText}</Typography>
                                </Stack>
                            </Stack>
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
