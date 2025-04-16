import {TextField} from "@mui/material";
import PropTypes from "prop-types";

const NumberInput = ({
                         label,
                         value,
                         onChange,
                         error,
                         helperText,
                     }) => {
    const handleChange = (e) => {
        onChange(Number(e.target.value));
    };
    return (
        <TextField
            label={label}
            type="number"
            value={value}
            onChange={handleChange}
            fullWidth
            error={error}
            helperText={error ? helperText : ""}
        />
    );
};

NumberInput.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.bool,
    helperText: PropTypes.string,
};

export default NumberInput