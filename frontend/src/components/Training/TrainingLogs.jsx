import {Box, Typography} from "@mui/material";
import {useEffect, useRef} from "react";

const TrainingLogs = ({trainingLog}) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        const ta = textareaRef.current;
        if (ta) {
            ta.scrollTop = ta.scrollHeight;
        }
    }, [trainingLog]);

    return (
        <Box>
            <Typography variant="h6" textAlign="center">
                Training progress
            </Typography>
            <Box
                component="textarea"
                ref={textareaRef}
                readOnly
                value={trainingLog}
                sx={{
                    width: "100%",
                    height: 650,
                    p: 2,
                    backgroundColor: "#1e1e1e",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    borderRadius: 2,
                    resize: "none",
                    border: "none",
                    outline: "none",
                    overflowY: "auto"
                }}
            />
        </Box>
    );
};

export default TrainingLogs;
