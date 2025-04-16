import { useState } from "react";
import PropTypes from "prop-types";
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TextField,
    IconButton,
    Paper,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

const ClassManagerModal = ({ classes, setClasses }) => {
    const [open, setOpen] = useState(false);
    const [newClass, setNewClass] = useState("");

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAddClass = () => {
        if (newClass.trim() !== "") {
            setClasses((prev) => [...prev, newClass.trim()]);
            setNewClass("");
        }
    };

    const handleDelete = (index) => {
        setClasses((prev) => prev.filter((_, i) => i !== index));
    };

    const moveUp = (index) => {
        if (index <= 0) return;
        setClasses((prev) => {
            const newArr = [...prev];
            [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
            return newArr;
        });
    };

    const moveDown = (index) => {
        if (index >= classes.length - 1) return;
        setClasses((prev) => {
            const newArr = [...prev];
            [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
            return newArr;
        });
    };

    return (
        <div>
            <Button variant="contained" onClick={handleOpen}>
                Manage Classes
            </Button>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Classes</DialogTitle>
                <DialogContent>
                    <Paper sx={{ mb: 2, p: 2 }}>
                        <TextField
                            label="New Class"
                            value={newClass}
                            onChange={(e) => setNewClass(e.target.value)}
                            fullWidth
                        />
                        <Button
                            variant="outlined"
                            onClick={handleAddClass}
                            disabled={!newClass.trim()}
                            sx={{ mt: 1 }}
                        >
                            Add Class
                        </Button>
                    </Paper>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Class Name</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {classes.map((cls, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index}</TableCell>
                                    <TableCell>{cls}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => moveUp(index)}
                                            disabled={index === 0}
                                        >
                                            <ArrowUpwardIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => moveDown(index)}
                                            disabled={index === classes.length - 1}
                                        >
                                            <ArrowDownwardIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(index)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

ClassManagerModal.propTypes = {
    classes: PropTypes.arrayOf(PropTypes.string).isRequired,
    setClasses: PropTypes.func.isRequired,
};

export default ClassManagerModal;
