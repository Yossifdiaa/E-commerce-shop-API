const mongoose = require("mongoose");
const schema = mongoose.Schema;

const footerSchema = new schema({
  label: String,
  content: String,
});

const Footer = mongoose.model("footerItems", footerSchema);

module.exports = Footer;
