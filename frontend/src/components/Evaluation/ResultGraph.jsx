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
                setError(null);
                let response;
                let data;

        /* ---------- YOLOv7 (results.txt – 15 columns) ---------- */
        if (model.toLowerCase() === "yolov7") {
          response = await fetch(
            `/api/training/file/${model}/${experimentId}/results.txt`
          );
          if (!response.ok)
            throw new Error("Error loading YOLOv7 results.txt");

          const lines = (await response.text())
            .split(/\r?\n/)
            .filter((l) => l.trim());

          data = lines.map((line) => {
            const c = line.trim().split(/\s+/);
            if (c.length < 15)
              return null; // ignore short header / footer lines

              return {
                epoch:               c[0],
                gpu_mem:             parseFloat(c[1]),
                train_box_loss:      parseFloat(c[2]),
                train_obj_loss:      parseFloat(c[3]),
                train_cls_loss:      parseFloat(c[4]),
                train_total_loss:    parseFloat(c[5]),
                labels:              parseInt(c[6], 10),
                img_size:            parseInt(c[7], 10),
                metrics_precision:   parseFloat(c[8]),
                metrics_recall:      parseFloat(c[9]),
                metrics_mAP_0_5:     parseFloat(c[10]),
                metrics_mAP_0_5_0_95: parseFloat(c[11]),
                val_box_loss:        parseFloat(c[12]),
                val_obj_loss:        parseFloat(c[13]),
                val_cls_loss:        parseFloat(c[14]),
              };
            })
            .filter(Boolean);
        }

        /* ---------- YOLOv5 (results.csv with headers) ---------- */
        else {
          response = await fetch(
            `/api/training/file/${model}/${experimentId}/results.csv`
          );
          if (!response.ok)
            throw new Error("Error loading YOLOv5 results.csv");

          const csvText = await response.text();
          const parsed = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: (h) =>
              h.trim().replace(/\//g, "_").replace(/:/g, "_").replace(/\./g, "_"),
          });

          if (parsed.errors.length)
            throw new Error("CSV parse error: " + parsed.errors[0].message);

          data = parsed.data;
        }

        if (!data?.length) throw new Error("No training records found");

        const labels = data.map((r) => r.epoch);

        const lossSets = [
          { key: "train_box_loss",  label: "Train Box",  color: "#8884d8" },
          { key: "train_obj_loss",  label: "Train Obj", color: "#82ca9d" },
          { key: "train_cls_loss",  label: "Train Cls", color: "#FFBB28"},
          { key: "train_total_loss",label: "Train Total",     color: "#444444"},
          { key: "val_box_loss",    label: "Val Box", color: "#888888"},
          { key: "val_obj_loss",    label: "Val Obj ", color: "#AAAAAA"},
          { key: "val_cls_loss",    label: "Val Cls", color: "#CCCCCC"},
        ].map(({ key, label, color }) => ({
          label,
          data: data.map((r) => r[key] ?? null),
          borderColor: color,
          backgroundColor: color,
          tension: 0.2,
          spanGaps: true,          // skip nulls
        }));

        const metricSets = [
          { key: "metrics_precision",        label: "Precision",         color: "#0088FE" },
          { key: "metrics_recall",           label: "Recall",            color: "#00C49F" },
          { key: "metrics_mAP_0_5",          label: "mAP@0.5",           color: "#FF8042" },
          { key: "metrics_mAP_0_5_0_95",     label: "mAP@0.5:0.95",      color: "#FF0000" },
        ].map(({ key, label, color }) => ({
          label,
          data: data.map((r) => r[key] ?? null),
          borderColor: color,
          backgroundColor: color,
          tension: 0.2,
          spanGaps: true,
        }));

        setChartDataLoss({ labels, datasets: lossSets });
        setChartDataMetrics({ labels, datasets: metricSets });
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [experimentId, model]);

  if (loading)
    return (
      <Box sx={{ textAlign: "center", my: 2 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );

  return (
    <Box sx={{ width: "80%", display: "flex", flexDirection: "column", gap: 4 }}>
      {chartDataLoss && (
        <Box sx={{ height: 400 }}>
          <Line
            data={chartDataLoss}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" }, title: { display: true, text: "Losses" } },
            }}
          />
        </Box>
      )}
      {chartDataMetrics && (
        <Box sx={{ height: 400 }}>
          <Line
            data={chartDataMetrics}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "top" }, title: { display: true, text: "Metrics" } },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ResultGraph;
