import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// import packagesRouter from './routes/packages';
// import metricsRouter from './routes/metrics';
import { uploadFile, downloadFile } from './services/s3service.js';

const app = express();
const PORT = process.env.PORT || 3000;

const bucketName = 'ece461storage';
const key = 'test-file.txt';
// Upload a file
uploadFile(bucketName, key, 'Hello, AWS S3!').then(() => {
    // Download the same file after uploading
    downloadFile(bucketName, key).then((data) => {
        console.log('Downloaded content:', data);
    });
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
// app.use('/api/packages', packagesRouter);
// app.use('/api/metrics', metricsRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});