const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/database');

const errorHandler = require('./middlewares/error');

const authRoutes = require('./routes/auth');
dotenv.config();

connectDB();
const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

app.use('/api/v1/auth', authRoutes);

app.use(errorHandler);

app.enable('trust proxy');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(
    `Event tokens API running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
