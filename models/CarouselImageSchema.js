const mongoose = require("mongoose");
const schema = mongoose.Schema;

const CarouselImageSchema = new schema({
  id: String,
  image: String,
});

const Image = mongoose.model("CarouselImages", CarouselImageSchema);

module.exports = Image;
