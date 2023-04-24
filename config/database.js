const mongoose = require('mongoose');

const connectDB = async () => {
  const DB = process.env.MONGO_URI;

  mongoose.connect(DB, {
    useNewUrlParser: true,
  }).then(() => console.log("DB connection successful!")).catch(err => console.log(err));

};

module.exports = connectDB;
