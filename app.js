const globalErrorHandler = require("./controllers/error");
const express = require("express");
const fileUpload = require('express-fileupload');
const cors = require('cors');
const helmet = require("helmet");
const authRoutes = require("./routes/auth");
const userRouter = require("./routes/user");
const errorHandler = require("./middlewares/error");
const mongoSanitize = require("express-mongo-sanitize");
const ErrorResponse = require("./utils/errorResponse");

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

// default options
app.use(fileUpload());
app.use(cors());

//Serving static files
app.use('/media', express.static(__dirname + '/media'));

//Data sanitization against NoSQL injection
app.use(mongoSanitize());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRouter);

app.use(errorHandler);

app.enable('trust proxy');

app.all("*", (req, res, next) => {
    next(new ErrorResponse(`Can\'t find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;