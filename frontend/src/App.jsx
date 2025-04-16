import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {AppBar, Toolbar, Typography, Button, Box, CssBaseline} from "@mui/material";
import Annotator from "./components/Annotate/Annotator";
import Training from "./components/Train/Training.jsx";
import Detection from "./components/Detect/Detection.jsx";
import Evaluation from "./components/Evaluation/Evaluation.jsx";
import Validation from "./components/Validation/Validation.jsx";
import GenericMenu from "./components/Common/GenericMenu.jsx";
import ValidationHistory from "./components/Validation/ValidationHistory.jsx";
import DetectionHistory from "./components/Detect/DetectionHistory.jsx";
import HomePage from "./components/Common/HomePage.jsx";

function App() {
    const trainingMenuItems = [
        { label: "New training", link: "/training/new" },
        { label: "History of training", link: "/training/history" },
    ];

    const dectectionionMenuItems = [
        { label: "Detection", link: "/detection/new" },
        { label: "History of detections", link: "/detection/history" },
    ];
    const validationMenuItems = [
        { label: "New validation", link: "/validation/new" },
        { label: "History of validations", link: "/validation/history" },
    ];
    return (
        <Router>
            <CssBaseline /> {/* Reset globálních stylů */}
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>

                    <Button color="inherit" component={Link} to="/">
                        Diploma Thesis
                    </Button>
                    </Typography>
                    <Button color="inherit" component={Link} to="/annotate">
                        Annotation
                    </Button>
                    <GenericMenu buttonLabel="Training" menuItems={trainingMenuItems} />
                    <GenericMenu buttonLabel="Validation" menuItems={validationMenuItems} />
                    <GenericMenu buttonLabel="Detection" menuItems={dectectionionMenuItems} />
                </Toolbar>
            </AppBar>

            {/* Obsah stránky */}
            <Box sx={{ mt: 8, p: 2 }}>
                {/* Přidáme margin-top, aby obsah nezačínal pod AppBar */}
                <Routes>
                    <Route path="/annotate" element={<Annotator />} />
                    <Route path="/validation/new" element={<Validation />} />
                    <Route path="/validation/history" element={<ValidationHistory />} />
                    <Route path="/detection/new" element={<Detection />} />
                    <Route path="/detection/history" element={<DetectionHistory />} />
                    <Route path="/training/new" element={<Training />} />
                    <Route path="/training/history" element={<Evaluation />} />
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </Box>
        </Router>
    );
}

export default App;
