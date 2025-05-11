import {useState} from "react";
import PropTypes from "prop-types";
import {FormControl, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup,} from "@mui/material";

const ModelWeightsSelect = ({ models, weights, trainingRuns }) => {
    const source = weights.selected?.type ?? "weights"; // "weights" | "runs"

    const handleSourceChange = (_, newSource) => {
        if (!newSource || newSource === source) return;

        const defaultValue =
            newSource === "weights"
                ? weights.list?.[0] ?? ""
                : trainingRuns?.[0]?.id ?? "";

        weights.setSelected({ type: newSource, value: defaultValue });
    };

    const options =
        source === "weights"
            ? weights.list
            : trainingRuns?.map((run) => run.id) || [];

    const handleSelect = (e) => {
        const value = e.target.value;
        weights.setSelected({type: source, value});
    };

    return (
        <>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Models</InputLabel>
                <Select
                    value={models.selected}
                    label="Models"
                    onChange={(e) => models.setSelected(e.target.value)}
                >
                    {models.list.map((m) => (
                        <MenuItem key={m} value={m}>
                            {m}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Toggle between weights and training runs */}
            <ToggleButtonGroup
                value={source}
                exclusive
                onChange={handleSourceChange}
                aria-label="source toggle"
                sx= {{ mb: 2, height: 55 }}
            >
                <ToggleButton value="weights">Weights</ToggleButton>
                <ToggleButton value="runs">Training Runs</ToggleButton>
            </ToggleButtonGroup>

            {/* Selector for weight names or run IDs */}
            <FormControl fullWidth>
                <InputLabel>
                    {source === "weights" ? "Weights" : "Training Runs"}
                </InputLabel>
                <Select
                    value={weights.selected.value || ""}
                    label={source === "weights" ? "Weights" : "Training Runs"}
                    onChange={handleSelect}
                >
                    {options.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                            {opt}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </>
    );
};

ModelWeightsSelect.propTypes = {
    models: PropTypes.shape({
        selected: PropTypes.string.isRequired,
        setSelected: PropTypes.func.isRequired,
        list: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    weights: PropTypes.shape({
        selected: PropTypes.string.isRequired,
        setSelected: PropTypes.func.isRequired,
        list: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    trainingRuns: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired
        })
    ),
};

export default ModelWeightsSelect;
