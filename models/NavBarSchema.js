const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const NameOfCollectionSchema = new Schema({
  Name : String,
});

const NameOfCollection = mongoose.model("NamesOfCollections", NameOfCollectionSchema );


module.exports = NameOfCollection;
