const mongoose = require("mongoose");
const schema = mongoose.Schema;
const {sliderSchema , stockItemSchema} = require('../models/sliderSchema')

const HomeBoxSchema = new schema({
  image: String,
  title: String,
  stock: [sliderSchema],
  boxType : String,
  stockForProducts : [stockItemSchema],
});

const Box = mongoose.model("homeBoxes", HomeBoxSchema);

module.exports = Box;
