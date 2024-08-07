const mongoose = require("mongoose");
const schema = mongoose.Schema;

const userSchema = new schema({
  username: String,
  password: String,
  userId : Number
});

const user = mongoose.model("User", userSchema);

module.exports = user;
