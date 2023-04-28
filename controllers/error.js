const ErrorResponse = require('./../utils/errorResponse')

const handleCastErrorDB = err =>{
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new ErrorResponse(message, 400);
}
const handleDuplicateFieldsDB = err =>{
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;

    return new ErrorResponse(message, 400);
}

const handleJWTError = () => new ErrorResponse('Invalid token. Please login again', 401);

const handleJWTExpiredError = () => new ErrorResponse('Your token has expired', 401);

const handleValidationErrorDB = err =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;

    return new ErrorResponse(message, 400);
}
const sendErrorDev = (err, res) =>{
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) =>{
    //Operational, trusted error: send message client
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        //Programming or other unknown error: don't leak error details
    }else{
        //Log error for dev
        console.error('Error: ', err);
        //Send generis message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    }

}

module.exports = (err, req, res, next)=>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status  || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err, res);
    }else if(process.env.NODE_ENV === 'production'){
        let error = {...err};
        error.name = err.name;
        error.code = err.code;
        error.errmsg = err.errmsg;

        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error.name ==='ValidationError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTError();
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
}