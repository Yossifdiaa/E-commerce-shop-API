const mongoose = require('mongoose');
const schema = mongoose.Schema;


const sizeSchema = new schema({
    size: String,
    quantity: Number
  });

const productSchema = new schema({
    code: String,
    brand: String,
    collectionName: String,
    price: Number,
    sizes: [sizeSchema],
    sale: Number,
    newCollection: String,
    description: String,
    images: String,
})


const ProductModel = mongoose.model("Products", productSchema);


module.exports = ProductModel;
