import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ResultGraph = ({ experimentId, model }) => {
    const [chartDataLoss, setChartDataLoss] = useState(null);
    const [chartDataMetrics, setChartDataMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch and parse result data when experimentId or model changes.
    useEffect(() => {
        if (!experimentId || !model) return;
        setLoading(true);

        async function fetchData() {
            try {
                let response;
                let data;

                if (model.toLowerCase() === "yolov7") {
                    // For yolov7, use results.txt
                    response = await fetch(`/api/training/file/${model}/${experimentId}/results.txt`);
                    if (!response.ok) {

                    }
                    const text = await response.text();
                    // Split text into non-empty lines
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                    // Parse each line by splitting on whitespace.
                    // Adjust the column mapping as needed.
                    data = lines.map(line => {
                        const cols = line.trim().split(/\s+/);
                        return {
                            epoch: cols[0],                          // e.g. "0/9"
                            // Ignoring column[1] ("0G") which might be GPU usage info
                            train_box_loss: parseFloat(cols[2]),       // e.g. 0.08713
                            train_obj_loss: parseFloat(cols[3]),       // e.g. 0.02267
                            train_cls_loss: parseFloat(cols[4]),       // e.g. 0.03065
                            // For validation losses, if not available separately, we use column[5] for all:
                            val_box_loss: parseFloat(cols[5]),         // e.g. 0.1404
                            val_obj_loss: parseFloat(cols[5]),         // duplicate value if separate metrics are not provided
                            val_cls_loss: parseFloat(cols[5]),
                            // Column[6] might provide additional info (e.g. number of samples) that we ignore.
                            // Column[7] (e.g. "640") might be image size; ignore here.
                            x_lr0: parseFloat(cols[8]),                // e.g. 0.001305
                            x_lr1: parseFloat(cols[9]),                // e.g. 0.004918
                            x_lr2: parseFloat(cols[10]),               // e.g. 0.0001283
                            metrics_precision: parseFloat(cols[11]),   // e.g. 2.441e-05
                            metrics_recall: parseFloat(cols[12]),        // e.g. 0.1165
                            metrics_mAP_0_5: parseFloat(cols[13]),       // e.g. 0.01986
                            metrics_mAP_0_5_0_95: parseFloat(cols[14]),   // e.g. 0.03438
                        };
                    });
                } else {
                    // For other models (e.g. yolov5), assume CSV format with headers.
                    response = await fetch(`/api/training/file/${model}/${experimentId}/results.csv`);
                    if (!response.ok) {
                        throw new Error("Error loading results.csv");
                    }
                    const csvText = await response.text();
                    const parsed = Papa.parse(csvText, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true,
                        transformHeader: header =>
                            header.trim().replace(/\//g, "_").replace(/:/g, "_").replace(/\./g, "_"),
                    });
                    if (parsed.errors.length > 0) {
                        console.error("CSV parse errors:", parsed.errors);
                        throw new Error("Error parsing CSV");
                    }
                    data = parsed.data;
                    if (!data || data.length === 0) {
                        throw new Error("CSV data is empty");
                    }
                }

                // Extract epochs for the x-axis; for yolov7, epoch is a string (e.g., "0/9")
                const epochs = data.map(row => row.epoch);

                // Prepare Loss & LR datasets (some keys may be null if not provided for yolov7)
                const datasetLossLR = [
                    {
                        label: "Training Box Loss",
                        data: data.map(row => row.train_box_loss),
                        borderColor: "#8884d8",
                        backgroundColor: "#8884d8",
                        tension: 0.2,
                    },
                    {
                        label: "Training Obj Loss",
                        data: data.map(row => row.train_obj_loss),
                        borderColor: "#82ca9d",
                        backgroundColor: "#82ca9d",
                        tension: 0.2,
                    },
                    {
                        label: "Training Cls Loss",
                        data: data.map(row => row.train_cls_loss),
                        borderColor: "#FFBB28",
                        backgroundColor: "#FFBB28",
                        tension: 0.2,
                    },
                    {
                        label: "Val Box Loss",
                        data: data.map(row => row.val_box_loss),
                        borderColor: "#888888",
                        backgroundColor: "#888888",
                        tension: 0.2,
                    },
                    {
                        label: "Val Obj Loss",
                        data: data.map(row => row.val_obj_loss || null),
                        borderColor: "#AAAAAA",
                        backgroundColor: "#AAAAAA",
                        tension: 0.2,
                    },
                    {
                        label: "Val Cls Loss",
                        data: data.map(row => row.val_cls_loss || null),
                        borderColor: "#CCCCCC",
                        backgroundColor: "#CCCCCC",
                        tension: 0.2,
                    },
                    {
                        label: "LR0",
                        data: data.map(row => row.x_lr0),
                        borderColor: "#6600CC",
                        backgroundColor: "#6600CC",
                        tension: 0.2,
                    },
                    {
                        label: "LR1",
                        data: data.map(row => row.x_lr1),
                        borderColor: "#CC0066",
                        backgroundColor: "#CC0066",
                        tension: 0.2,
                    },
                    {
                        label: "LR2",
                        data: data.map(row => row.x_lr2),
                        borderColor: "#009900",
                        backgroundColor: "#009900",
                        tension: 0.2,
                    },
                ];
                const chartDataLossObj = {
                    labels: epochs,
                    datasets: datasetLossLR,
                };

                // Prepare Metrics dataset
                const datasetMetrics = [
                    {
                        label: "Precision",
                        data: data.map(row => row.metrics_precision),
                        borderColor: "#0088FE",
                        backgroundColor: "#0088FE",
                        tension: 0.2,
                    },
                    {
                        label: "Recall",
                        data: data.map(row => row.metrics_recall),
                        borderColor: "#00C49F",
                        backgroundColor: "#00C49F",
                        tension: 0.2,
                    },
                    {
                        label: "mAP@0_5",
                        data: data.map(row => row.metrics_mAP_0_5),
                        borderColor: "#FF8042",
                        backgroundColor: "#FF8042",
                        tension: 0.2,
                    },
                    {
                        label: "mAP@0_5_0_95",
                        data: data.map(row => row.metrics_mAP_0_5_0_95),
                        borderColor: "#FF0000",
                        backgroundColor: "#FF0000",
                        tension: 0.2,
                    },
                ];
                const chartDataMetricsObj = {
                    labels: epochs,
                    datasets: datasetMetrics,
                };

                setChartDataLoss(chartDataLossObj);
                setChartDataMetrics(chartDataMetricsObj);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [experimentId, model]);

    if (loading) {
        return (
            <Box sx={{ textAlign: "center", my: 2 }}>
                <CircularProgress />
            </Box>
        );
    }
    if (error) {
        return (
            <Typography variant="body1" color="error" align="center">
                {error}
            </Typography>
        );
    }
    if (!chartDataLoss && !chartDataMetrics) {
        return (
            <Typography variant="body2" color="text.secondary" align="center">
                Data not available.
            </Typography>
        );
    }

    const optionsLoss = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.2,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Loss & LR" },
        },
    };

    const optionsMetrics = {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.2,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Metrics (Precision, Recall, mAP)" },
        },
    };

    return (
        <Box sx={{ width: "80%", display: "flex", flexDirection: "column", gap: 4 }}>
            {chartDataLoss && (
                <Box sx={{ height: 400 }}>
                    <Line data={chartDataLoss} options={optionsLoss} />
                </Box>
            )}
            {chartDataMetrics && (
                <Box sx={{ width: "100%", height: 400 }}>
                    <Line data={chartDataMetrics} options={optionsMetrics} />
                </Box>
            )}
        </Box>
    );
};

export default ResultGraph;
