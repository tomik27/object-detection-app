import {TextField} from "@mui/material";
import PropTypes from "prop-types";

const NumberInput = ({
                         label,
                         value,
                         onChange,
                         error,
                         helperText,
                         ...textFieldProps
                     }) => {
    const handleChange = (e) => {
        const val = e.target.value;
        onChange(val === '' ? '' : Number(val));
    };

    return (
        <TextField
            label={label}
            type="number"
            value={value}
            onChange={handleChange}
            error={error}
            helperText={error ? helperText : helperText}
            fullWidth
            {...textFieldProps}
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