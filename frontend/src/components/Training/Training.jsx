import {useEffect, useRef, useState} from "react";
import {
    Box,
    Typography,
    Paper, Divider,
} from "@mui/material";
import TrainingLogs from "./TrainingLogs.jsx";
import TrainingForm from "./TrainingForm.jsx";

export default function Training() {
    const [imageSize, setImageSize] = useState(640);
    const [batchSize, setBatchSize] = useState(8);
    const [epochs, setEpochs] = useState(5);
    const [optimizer, setOptimizer] = useState("");
    const [device, setDevice] = useState("");
    const [cosineScheduler, setCosineScheduler] = useState(false);

    const stoppedRef = useRef(false);
    const eventSourceRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const weightsOptions = {
        yolov5: ["yolov5s.pt", "yolov5m.pt", "yolov5l.pt"],
        yolov7: ["yolov7.pt", "yolov7-tiny.pt", "yolov7-e6.pt", "yolov7-d6.pt", "yolov7x.pt"],
    };
    const [selectedModel, setSelectedModel] = useState("yolov5");
    const [modelsList] = useState(["yolov5", "yolov7"]);
    const [currentExperiment, setCurrentExperiment] = useState(null);
    const [trainingRuns, setTrainingRuns] = useState([]);

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
                    //setSelectedWeight(runs[0].id);
                }
            } catch (err) {
                console.error("Error fetching training runs:", err);
            }
        }

        if (selectedModel) {
            fetchTrainingRuns();
        }
    }, [selectedModel]);

    const createEventSource = () => {
        const es = new EventSource("/api/training/logs");
        stoppedRef.current = false;
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            if (stoppedRef.current) return;

            const line = event.data.endsWith("\n") ? event.data : event.data + "\n";
            setTrainingLog((prev) => prev + line);

            const doneRE = /(Results saved to|RuntimeError|epochs completed in|finished)/;
            if (doneRE.test(event.data)) {
                setIsProcessing(false);
                es.close();
            } else {
                setIsProcessing(true);
            }
        };

        return es;
    };

    useEffect(() => {
        const es = createEventSource();
        return () => es.close();
    }, []);

    const models = {
        selected: selectedModel,
        setSelected: setSelectedModel,
        list: modelsList,
    };

    const firstValue = weightsOptions[selectedModel]?.[0] ?? "";

    const [selectedWeight, setSelectedWeight] = useState({
        type: "weights",
        value: firstValue,
    });
    const [weightsList, setWeightsList] = useState(weightsOptions[selectedModel] ?? []);

    useEffect(() => {
        const newList = weightsOptions[selectedModel] ?? [];
        setWeightsList(newList);
        setSelectedWeight({
            type: "weights",
            value: newList[0] ?? "",
        });
    }, [selectedModel]);

    const weights = {
        selected: selectedWeight,
        setSelected: setSelectedWeight,
        list: weightsList,
    };


    const handleSelectDataDir = (input = null) => {
        if (typeof input === "string") {
            setDataDirectory(input);
        } else {
            const folderPath = prompt("Enter path to data directory");
            if (folderPath) {
                setDataDirectory(folderPath);
            }
        }
    };

    const handleSelectValDir = (input = null) => {
        if (typeof input === "string") {
            setValDirectory(input);
        } else {
            const folderPath = prompt("Enter path to validation directory");
            if (folderPath) {
                setValDirectory(folderPath);
            }
        }
    };

    const predictNextExp = (runs) => {
        if (!runs.length) return "exp";
        const lastId = runs[0].id;
        const numStr = lastId.slice(3);
        const nextNum = numStr === "" ? 1 : Number(numStr) + 1;
        return nextNum === 0 ? "exp" : `exp${nextNum}`;
    };


    const [dataDirectory, setDataDirectory] = useState("");
    const [valDirectory, setValDirectory] = useState("");
    const directories = {
        data: dataDirectory,
        val: valDirectory,
        selectData: handleSelectDataDir,
        selectVal: handleSelectValDir,
    };

    const [classes, setClasses] = useState(["dog", "tree"]);
    const classState = {
        classes, setClasses
    };

    const [trainingLog, setTrainingLog] = useState("");

    const trainingParams = {
        imageSize,
        setImageSize,
        batchSize,
        setBatchSize,
        epochs,
        setEpochs,
        optimizer,
        setOptimizer,
        device,
        setDevice,
        cosineScheduler,
        setCosineScheduler
    };

    // --- Start train ---
    const handleTrain = async () => {
        setTrainingLog("Training started...\n");
        try {

            const resList = await fetch(`/api/training/list?includeAll=True&model=${selectedModel}`);
            const runs = resList.ok ? await resList.json() : [];

            setCurrentExperiment(predictNextExp(runs));

            const response = await fetch("/api/training", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    imageSize,
                    batchSize,
                    epochs,
                    optimizer,
                    device,
                    cosineScheduler,
                    weights: selectedWeight,
                    model: selectedModel,
                    dataDir: dataDirectory,
                    valDir: valDirectory,
                    classList: classes,
                }),
            });
            if (response.ok) {
                setTrainingLog((prev) => prev + "Training initiated.\n");
                stoppedRef.current = false
                createEventSource();
                setIsProcessing(true);
            } else {
                setTrainingLog((prev) => prev + "Failed to start training.\n");
            }
        } catch (error) {
            setTrainingLog((prev) => prev + "Error: " + error.message + "\n");
        }
    };

    const handleStop = async () => {
        stoppedRef.current = true;
        setIsProcessing(false);
        try {
            const response = await fetch("/api/training/stop", {method: "POST"});
            if (response.ok) {
                setTrainingLog((prev) => prev + "Training stopped.\n");
                //setIsProcessing(false);
            } else {
                setTrainingLog((prev) => prev + "Failed to stop training.\n");
            }
        } catch (error) {
            setTrainingLog((prev) => prev + "Error: " + error.message + "\n");
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
                sx={{p: 4, borderRadius: 2, width: "80vw", maxWidth: "90%", minWidth: "600px"}}
            >
                <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
                    Training
                </Typography>
                <Divider sx={{mb: 3}}/>

                <TrainingForm
                    trainingParams={trainingParams}
                    directories={directories}
                    models={models}
                    weights={weights}
                    classState={classState}
                    onTrain={handleTrain}
                    onStop={handleStop}
                    isProcessing={isProcessing}
                    trainingRuns={trainingRuns}
                />
                {currentExperiment && (
                    <Typography variant="body1" textAlign="center" sx={{mt: 2}}>
                        Trainning result will be stored in folder: {currentExperiment}
                    </Typography>
                )}
                <TrainingLogs trainingLog={trainingLog}/>
            </Paper>
        </Box>
    );
};
