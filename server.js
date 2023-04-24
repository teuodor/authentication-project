const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

const errorHandler = require('./middlewares/error');

process.on('uncaughtException', async err => {
  console.log(err.name, err.message);
  console.log('Uncaught exception! Shutting down...');

  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandler rejection! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
})


const authRoutes = require('./routes/auth');
dotenv.config();

const connectDB = require('./config/database');
connectDB();
const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use('/api/v1/auth', authRoutes);

app.use(errorHandler);

app.enable('trust proxy');

const PORT = process.env.PORT || 8000;


const server = app.listen(PORT, () => {
  console.log(`Event tokens API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});