const HomePage = () => {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Welcome to Application</h1>
            <p className="text-lg mb-6">
                This application is designed to simplify and streamline complex workflows by integrating various tools and modules into one unified platform. Whether you are managing data, analyzing reports, or collaborating with a team, our solution offers the features you need in a clean and user-friendly interface.
            </p>

            <h2 className="text-2xl font-semibold mb-2">Overview</h2>
            <p className="mb-6">
                The application is composed of multiple modules, each focused on a specific area to provide flexibility and scalability.
            </p>

            <h3 className="text-xl font-semibold mb-2">Modules</h3>
            <ul className="list-disc list-inside space-y-2">
                <li>
                    <strong>Annotation Module:</strong> Allows users to annotate images or data points for training and analysis.
                </li>
                <li>
                    <strong>Training Module:</strong> Lets users train models using the annotated data with just a few clicks.
                </li>
                <li>
                    <strong>Validation Module:</strong> Lets users train models using the annotated data with just a few clicks..
                </li>
                <li>
                    <strong>Detection Module:</strong> Provides real-time detection capabilities using trained models.
                </li>
            </ul>
        </div>
    );
};

export default HomePage;
