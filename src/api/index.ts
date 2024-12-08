import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import packageRouter from './routes/package.js';
import packagesRouter from './routes/packages.js';
import tracksRouter from './routes/tracks.js';
import resetRouter from './routes/reset.js';  // Import the reset router
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// const app = express();

app.use(express.json()); // Parse incoming JSON requests

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase JSON payload size limit
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload size limit

// Routes
app.use('/package', packageRouter);
app.use('/packages', packagesRouter);
app.use('/tracks', tracksRouter);
app.use('/reset', resetRouter);  // Add the reset endpoint

// Start server
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});

export default app;