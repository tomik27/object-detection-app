import { Box, Typography } from "@mui/material";

const TrainingLogs = ({ trainingLog }) => {
    return (
        <Box>
            <Typography variant="h6" textAlign="center">
                Training progress
            </Typography>
            <Box
                component="textarea"
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
                }}
            />
        </Box>
    );
};

export default TrainingLogs;
