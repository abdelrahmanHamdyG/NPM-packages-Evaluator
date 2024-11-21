import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import packageRouter from './routes/package.js';
import packagesRouter from './routes/packages.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase JSON payload size limit
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload size limit

// Routes
app.use('/package', packageRouter);
app.use('/packages', packagesRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
