const {Slider} = require("../models/sliderSchema");
const Box = require('../models/HomeBoxSchema')

exports.getSliders = (req, res) => {
  Slider.find()
    .then(sliders => {
      const updatedSliders = sliders.map(s => {
        return {
          title: s.title,
          stock: s.stock.map(product => {
            // Append the host and filename to the image path
            if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
              product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
            } else {
              product.images = "";
            }
            return product;
          }),
          boxNames : s.boxNames,
        };
      });
      res.json(updatedSliders);
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postSlider = async (req, res) => {
  const title = req.body.slidertitle;
  const stock = req.body.stock;
  const boxes = req.body.boxes;

  const existingSlider = await Slider.findOne({ title: title });

  if (existingSlider) {
    console.log("slider is already exist");
    return res.json("slider is already exist");
  }

  const slider = new Slider();
  if (title) {
    slider.title = title;
  }
  if (stock) {
    const productsAsAnArray = JSON.parse(stock);
    for (let i = 0; i < productsAsAnArray.length; i++) {
      let images = productsAsAnArray[i].images.split(",");
      images = images.map(i => i.split("images/")[1]);
      productsAsAnArray[i].images = images.join(",");
    }
    slider.stock = productsAsAnArray;
  }
  if (boxes && boxes.length > 0) {
    const boxessAnArray = JSON.parse(boxes);

    for (const boxTitle of boxessAnArray) {
      let box = await Box.findOne({ title: boxTitle });
      box.stock.push(slider);
      slider.boxNames.push(box.title);
      await box.save();
    }
  }
  await slider.save();
  res.status(200).json("saved");
  console.log("new slider added", slider);
};

exports.deleteSlider = async (req, res) => {
  const title = req.params.title;
  try {
  const boxes = await Box.find();
  for (const box of boxes) {
      box.stock = box.stock.filter(slider => slider.title !== title);
        await box.save();
      }
  console.log("slider in box deleted successfully");


  await Slider.findOneAndDelete({ title });
  console.log("SLIDER DELETED SUCCESSFULLY!");
  res.status(200).json("deleted");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "An error occurred while deleting the product" });
  }
};
exports.getSliderByTitle = (req, res) => {
  const title = req.params.title;
  Slider.findOne({ title })
    .then(slider => {
      if (!slider) {
        return res.status(404).json({ message: "Slider not found" });
      }
      const updatedSlider = {
        title: slider.title,
        stock: slider.stock.map(product => {
          if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
            product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
          } else {
            product.images = "";
          }
          return product;
        }),
        boxNames : slider.boxNames,
      };

      res.json(updatedSlider);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    });
};
