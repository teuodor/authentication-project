const dotenv = require('dotenv');

process.on('uncaughtException', async (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught exception! Shutting down...');

  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandler rejection! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

dotenv.config();
const app = require('./app');

const connectDB = require('./config/database');
connectDB();

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(
    `AuthApp API running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
