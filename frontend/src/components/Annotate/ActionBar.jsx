import React, {Component} from "react";
import {Stack, Paper, Button, Checkbox, FormControlLabel} from "@mui/material";
import ClassManagerModal from "../Train/ClassManagerModal.jsx";

class ActionBar extends Component {
    render() {
        const {
            onSelectDataset,
            onChangeDefaultDir,
            onLoadClasses,
            onToggleAngle,
            useAngle,
            classList,
            setClassList,
            onNextImage,
            onClearAnnotations,
        } = this.props;

        return (
            <>
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 3,
                        backgroundColor: "#ffffff",
                    }}
                >
                    <Stack spacing={2}>
                        {/* First row: Dataset-related controls */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button variant="contained" component="label">
                                Select Dataset
                                <input
                                    type="file"
                                    hidden
                                    webkitdirectory="true"
                                    onChange={onSelectDataset}
                                />
                            </Button>
                            <Button variant="contained" onClick={onChangeDefaultDir}>
                                Set Storage folder
                            </Button>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={useAngle}
                                        onChange={onToggleAngle}
                                        color="primary"
                                    />
                                }
                                label="Use Angle"
                            />
                            <Button variant="contained" component="label" color="primary">
                                Load Classes YAML
                                <input
                                    type="file"
                                    accept=".yaml,.yml"
                                    hidden
                                    onChange={onLoadClasses}
                                />
                            </Button>
                            <ClassManagerModal classes={classList} setClasses={setClassList}/>
                        </Stack>
                    </Stack>
                </Paper>
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 3,
                        backgroundColor: "#ffffff",
                    }}
                >
                    {/* Second row: Annotation-specific actions */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button variant="contained" onClick={onNextImage}>
                            Next Image
                        </Button>
                        <Button variant="outlined" color="error" onClick={onClearAnnotations}>
                            Clear Annotations
                        </Button>
                    </Stack>

                </Paper>
            </>);
    }
}

export default ActionBar;
