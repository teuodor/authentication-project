const jwt = require('jsonwebtoken');
const util = require('util');
const ErrorResponse = require("./errorResponse");
const log = require("./logsChalk");

const decodeToken = async (req, res, next) => {
    let token;

    // Get token and check if exist
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('You are not logged in!', 401));
    } else {
        try{
            return await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);
        }catch(err){
            console.log(err)
            return next(new ErrorResponse('Invalid token, please login again', 400));
        }
    }


};

module.exports = decodeToken;