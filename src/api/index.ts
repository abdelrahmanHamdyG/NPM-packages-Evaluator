import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import packagesRouter from './routes/packages.js';
import packageRouter from './routes/package.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/packages', packagesRouter);
app.use('/package', packageRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});