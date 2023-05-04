const ErrorResponse = require("./errorResponse");
const mongoose = require('mongoose');
const User = require('./../models/User');
const decodeToken = require("./decodeToken");

function generatePassword(length) {
    let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password  = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password  += charset.charAt(Math.floor(Math.random() * n));
    }
    return password ;
}

module.exports = {
    generatePassword: generatePassword,
};