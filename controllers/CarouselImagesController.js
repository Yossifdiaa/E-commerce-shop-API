const Image = require("../models/CarouselImageSchema");

exports.getImages = (req, res) => {
  Image.find()
    .then(images => {
      const updatedImages = images.map(image => {
        // Append the host and filename to the image path
        if (image.image && image.image.indexOf("upload") === -1 && image.image.indexOf("src") === -1 && image.image.indexOf("image") === -1) {
          image.image = `${req.protocol}://${req.get("host")}/images/${image.image}`;
        } else {
          image.image = "";
        }
        return image;
      });
      res.json(updatedImages);
    })
    .catch(err => {
      console.log(err);
    });
};

exports.addImage = async (req, res) => {
  // Logic to generate a unique order number
  // For example, you can use a combination of current timestamp and a random number
  const id = (() => Date.now().toString() + Math.floor(Math.random() * 1000))();

  const image = new Image();
  image.id = id;

  if (req.files && req.files.length > 0) {
    const images = [];
    req.files.forEach(file => images.push(file.filename));
    image.image = images.join(",");
  } else {
    console.log("no image provided");
  }

  await image.save();
  res.json("saved");
};

exports.deleteImage = (req, res) => {
  const id = req.params.id;
  Image.findOneAndDelete({ id })
    .then(result => {
      res.json("deleted");
      console.log("SLIDER DELETED SUCCESSFULLY!");
    })
    .catch(err => {
      console.log(err);
    });
};
