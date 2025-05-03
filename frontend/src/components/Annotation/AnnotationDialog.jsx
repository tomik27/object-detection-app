// AnnotationDialog.js
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";

export default function AnnotationDialog({
                                             open,
                                             angle,
                                             onChangeAngle,
                                             selectedClass,
                                             onChangeClass,
                                             classList,
                                             onClose,
                                             onSave,
                                         }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Angle / Class</DialogTitle>
            <DialogContent>
                <TextField
                    label="Angle (°)"
                    type="number"
                    fullWidth
                    value={angle}
                    onChange={(e) => onChangeAngle(e.target.value)}
                    sx={{mt: 2}}
                />
                <FormControl fullWidth sx={{mt: 2}}>
                    <InputLabel id="class-select-label">Class</InputLabel>
                    <Select
                        labelId="class-select-label"
                        value={selectedClass}
                        onChange={(e) => onChangeClass(e.target.value)}
                    >
                        {classList.map((cls, idx) => (
                            <MenuItem key={idx} value={cls}>
                                {cls}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => onChangeAngle((prevAngle) => (180 - parseFloat(prevAngle)) % 180)}
                    variant="text"
                >
                    Switch Angle
                </Button>
                <Button onClick={onSave} variant="contained">
                    Save
                </Button>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
