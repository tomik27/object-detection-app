import { Box, Button, Typography } from "@mui/material";
import { FolderOpen } from "@mui/icons-material";

const DirectoryPicker = ({ label, directory, onSelect }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            minWidth: 0,
            flex: 1,
        }}
    >
        <Button
            variant="contained"
            size="medium"
            onClick={onSelect}
            startIcon={<FolderOpen />}
        >
            {label}
        </Button>
        <Typography
            variant="body2"
            sx={{
                width: '100%',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                fontSize: '0.875rem',
                lineHeight: 1.2,
                mt: 1,
            }}
        >
            {directory || 'No folder selected'}
        </Typography>
    </Box>
);

export default DirectoryPicker;
