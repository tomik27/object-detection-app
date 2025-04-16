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
            <DialogTitle>Upravit úhel / Třídu</DialogTitle>
            <DialogContent>
                <TextField
                    label="Úhel (°)"
                    type="number"
                    fullWidth
                    value={angle}
                    onChange={(e) => onChangeAngle(e.target.value)}
                    sx={{mt: 2}}
                />
                <FormControl fullWidth sx={{mt: 2}}>
                    <InputLabel id="class-select-label">Třída</InputLabel>
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
                    Přepnout úhel
                </Button>
                <Button onClick={onSave} variant="contained">
                    Uložit
                </Button>
                <Button onClick={onClose} variant="outlined">
                    Zrušit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
