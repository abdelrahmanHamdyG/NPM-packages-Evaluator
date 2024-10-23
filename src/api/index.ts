import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// import packagesRouter from './routes/packages';
// import metricsRouter from './routes/metrics';

const app = express();
const PORT = process.env.PORT || 3000;

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