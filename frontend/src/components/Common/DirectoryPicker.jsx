import {Box, Button, Typography} from "@mui/material";
import {FolderOpen} from "@mui/icons-material";

const DirectoryPicker = ({label, directory, onSelect}) => (
    <Box sx={{textAlign: "center"}}>
        <Button variant="contained" size="medium" onClick={onSelect} startIcon={<FolderOpen/>}>
            {label}
        </Button>
        <Typography variant="body2">{directory || "No folder selected"}</Typography>
    </Box>
);

export default DirectoryPicker;
