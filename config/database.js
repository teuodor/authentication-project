const mongoose = require('mongoose');

const connectDB = async () => {
  const database = process.env.TESTING_MODE ? process.env.MONGO_URI_TESTING : process.env.MONGO_URI;

  mongoose.connect(database, {
    useNewUrlParser: true,
  }).then(() => console.log("DB connection successful!")).catch(err => console.log(err));

};

module.exports = connectDB;
