// DetectionResults.js
import { Box, Typography, Button } from "@mui/material";
import PropTypes from "prop-types";

const DetectionResults = ({
                              currentExperiment,
                              detectResultImages,
                              currentImageIndex,
                              nextImage,
                              prevImage
                          }) => {
    return (
        <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Detection Results: {currentExperiment}
            </Typography>
            <img
                src={detectResultImages[currentImageIndex]}
                alt={`Detection result ${currentImageIndex + 1}`}
                style={{maxWidth: "100%", borderRadius: "8px"}}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button variant="contained" onClick={prevImage}>Previous</Button>
                <Button variant="contained" onClick={nextImage}>Next</Button>
            </Box>
            <Typography variant="body1" sx={{mt: 1}}>
                Image {currentImageIndex + 1} of {detectResultImages.length}
            </Typography>
        </Box>
    );
};

DetectionResults.propTypes = {
  currentExperiment: PropTypes.string.isRequired,
  detectResultImages: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentImageIndex: PropTypes.number.isRequired,
  nextImage: PropTypes.func.isRequired,
  prevImage: PropTypes.func.isRequired,
};

export default DetectionResults;
