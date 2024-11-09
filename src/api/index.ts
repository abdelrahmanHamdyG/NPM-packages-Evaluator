import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import packageRouter from './routes/package.js';
import resetRouter from './routes/reset.js';  // Import the reset router

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/package', packageRouter);
app.use('/reset', resetRouter);  // Add the reset endpoint

// Start server
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
