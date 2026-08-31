const connectDB = require('./config/db');
const { startScheduler } = require('./services/schedulerService');
const app = require('./app');

const PORT = process.env.PORT || 6991;

const startServer = async () => {
    await connectDB();
    startScheduler();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
