const mongoose = require("mongoose");
const schema = mongoose.Schema;

const guestSchema = new schema({
    cart : [{
        code: String,
        collectionName: String,
        price: Number,
        sale: Number,
        size: String,
        quantity: {
          type: Number,
          default: 1,
        },
        description: String,
        images: String,
    }],
    guestId : Number,
    orders : Array,
});

const guest = mongoose.model("guests", guestSchema);

module.exports = guest;
