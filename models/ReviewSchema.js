const mongoose = require('mongoose')
const schema = mongoose.Schema;

const messageSchema = new schema({
    name : String,
    message : String,
}) 


const reviews = mongoose.model("reviews" , messageSchema)

module.exports = reviews