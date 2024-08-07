const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
  Brand: String,
});

const Brands = mongoose.model("Brands", brandSchema);

module.exports = Brands;
