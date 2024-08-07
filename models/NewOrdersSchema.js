const mongoose = require('mongoose')
const schema = mongoose.Schema;


const OrderSchema = new schema({
    orderId : Number,
    name : String,
    email : String,
    phone : String,
    area : String,
    zone : String,
    address : String,
    note : String,
    date: String,
    TotalPrice: Number, 
    productsOrdered : [{
        code : String,
        images : String,
        size : String,
        quantity : String,
        price : Number,
        images : String,
    }],


})

const Order = mongoose.model('Orders' , OrderSchema );

module.exports = Order;