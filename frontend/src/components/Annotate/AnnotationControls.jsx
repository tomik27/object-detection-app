import {Button, Stack} from "@mui/material";

export default function AnnotationControls({
                                               onSelectDataset, onChangeDefaultDir, onNextImage, onClearAnnotations
                                           }) {
    return (
        <Stack direction="row" spacing={2} mb={0}>

            {/* 1) Výběr datasetu */}
            <Button variant="contained">
                <label>
                    Vyber složku datasetu
                    <input
                        type="file"
                        hidden
                        webkitdirectory=""
                        onChange={onSelectDataset}
                    />
                </label>
            </Button>
            <Button variant="contained" onClick={onChangeDefaultDir}>Změnit výchozí složku</Button>
            <Button variant="contained" onClick={onNextImage}>Další obrázek</Button>
            <Button variant="outlined" color="error" onClick={onClearAnnotations}>Smazat anotace</Button>
        </Stack>
    );
}
