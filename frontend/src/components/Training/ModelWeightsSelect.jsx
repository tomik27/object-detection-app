import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import PropTypes from "prop-types";

const ModelWeightsSelect = ({models, weights}) => (
    <>
        <FormControl fullWidth>
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

        <FormControl fullWidth>
            <InputLabel>Weights</InputLabel>
            <Select
                value={weights.selected}
                label="Weights"
                onChange={(e) => weights.setSelected(e.target.value)}
            >
                {weights.list.map((w) => (
                    <MenuItem key={w} value={w}>
                        {w}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    </>
);

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
};

export default ModelWeightsSelect