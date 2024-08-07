const mongoose = require("mongoose");
const schema = mongoose.Schema;

const sizeSchema = new schema({
    size: String,
    quantity: Number
  });
const stockItemSchema = new schema({
    code: String,
    brand: String,
    collectionName: String,
    price: Number,
    sizes: [sizeSchema],
    sale: Number,
    newCollection: String,
    description: String,
    images: String,
  });

const sliderSchema = new schema({
    title : String,
    stock : [stockItemSchema],
    boxNames : Array
})

const Slider = mongoose.model('sliders' , sliderSchema);

module.exports = {Slider , sliderSchema , stockItemSchema};