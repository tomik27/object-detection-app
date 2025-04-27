import {useEffect, useState} from "react";
import {
    Box,
    Typography,
    Paper, Divider,
} from "@mui/material";
import TrainingLogs from "./TrainingLogs.jsx";
import TrainingForm from "./TrainingForm.jsx";

export default function Training() {
    const [imageSize, setImageSize] = useState(640);
    const [batchSize, setBatchSize] = useState(16);
    const [epochs, setEpochs] = useState(50);
    const [isProcessing, setIsProcessing] = useState(false);
    const weightsOptions = {
        yolov5: ["yolov5s.pt", "yolov5m.pt", "yolov5l.pt"],
        yolov7: ["yolov7.pt", "yolov7-tiny.pt", "yolov7-e6.pt", "yolov7-d6.pt", "yolov7x.pt"],
    };
    const [selectedModel, setSelectedModel] = useState("yolov5");
    const [modelsList] = useState(["yolov5", "yolov6", "yolov7"]);
    const [currentExperiment, setCurrentExperiment] = useState(null);

    useEffect(() => {
        const eventSource = new EventSource("/api/training/logs");

        eventSource.onmessage = function (event) {
            const line = event.data.endsWith("\n") ? event.data : event.data + "\n";
            setTrainingLog(prev => prev + line);
            if (event.data.includes("Results saved to","Trénink ukončen","epochs completed in")) {
                setIsProcessing(false);
                eventSource.close();
            } else {
                setIsProcessing(true);
            }
        };

        eventSource.onerror = function (err) {
            console.error("Error in log stream:", err);
            eventSource.close();
            setIsProcessing(false);
        };

            // unmount connect
        return () => {
            eventSource.close();
            setIsProcessing(false);
        };
    }, []);
    useEffect(() => {
        setWeightsList(weightsOptions[selectedModel]);
        setSelectedWeight(weightsOptions[selectedModel][0]);
    }, [selectedModel]);

    const models = {
        selected: selectedModel,
        setSelected: setSelectedModel,
        list: modelsList,
    };

    const [selectedWeight, setSelectedWeight] = useState("yolov5s.pt");
    const [weightsList, setWeightsList] = useState(weightsOptions[selectedModel]);

    useEffect(() => {
        setWeightsList(weightsOptions[selectedModel]);
        setSelectedWeight(weightsOptions[selectedModel][0]);
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


    const [dataDirectory, setDataDirectory] = useState("C:\\diplomka\\kody\\newest_yolo\\cube");
    const [valDirectory, setValDirectory] = useState("C:\\diplomka\\kody\\newest_yolo\\cube");
    const directories = {
        data: dataDirectory,
        val: valDirectory,
        selectData: handleSelectDataDir,
        selectVal: handleSelectValDir,
    };

    const [classes, setClasses] = useState(["cube", "cha"]);
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
    };

    // --- Start train ---
    const handleTrain = async () => {
        setTrainingLog("Training started...\n");
        try {

            const resList = await fetch(`/api/training/list?model=${selectedModel}`);
            const runs = resList.ok ? await resList.json() : [];

            setCurrentExperiment( predictNextExp(runs));

            const response = await fetch("/api/training", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    imageSize,
                    batchSize,
                    epochs,
                    weights: selectedWeight,
                    model: selectedModel,
                    dataDir: dataDirectory,
                    valDir: valDirectory,
                    classList: classes,
                }),
            });
            if (response.ok) {
                setTrainingLog((prev) => prev + "Training initiated.\n");
                setIsProcessing(true);
            } else {
                setTrainingLog((prev) => prev + "Failed to start training.\n");
            }
        } catch (error) {
            setTrainingLog((prev) => prev + "Error: " + error.message + "\n");
        }
    };

    // --- Stop train ---
    const handleStop = async () => {
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
                sx={{
                    p: 4,
                    borderRadius: 2,
                    width: "80vw",
                    maxWidth: "90%",
                    minWidth: "600px",
                }}
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
                />
                {currentExperiment && (
                    <Typography variant="body1" textAlign="center" sx={{mt: 2}}>
                        Trainning result is stored in folder: {currentExperiment}
                    </Typography>
                )}
                <TrainingLogs trainingLog={trainingLog}/>
            </Paper>
        </Box>
    );
};
