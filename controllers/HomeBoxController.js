const Box = require("../models/HomeBoxSchema");
const {Slider} = require('../models/sliderSchema')
const { optimizeImage } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

exports.getBoxes = (req, res) => {
  Box.find()
    .then(boxes => {
      let updatedBoxes = boxes.map(box => {
        if (box.image && box.image.indexOf("upload") === -1 && box.image.indexOf("src") === -1 && box.image.indexOf("image") === -1) {
          box.image = `${req.protocol}://${req.get("host")}/images/${box.image}`;
        } else {
          box.image = "";
        }
        return {
          title: box.title,
          image: box.image,
          boxType: box.boxType,
          stock: box.stock.map(product => {
            if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
              product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
            } else {
              product.images = "";
            }
            return product;
          }),
        };
      });
      res.json(updatedBoxes);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "An error occurred" });
    });
};


exports.getBoxesForBoxTypeSliders = (req, res) => {
  const boxTypeSliders = "sliders";
  Box.find({boxType : boxTypeSliders})
  .then(boxes => {
      const updatedboxes = boxes.map(box => {
        if (box.image && box.image.indexOf("upload") === -1 && box.image.indexOf("src") === -1 && box.image.indexOf("image") === -1) {
          box.image = `${req.protocol}://${req.get("host")}/image/${box.image}`;
        } else {
          box.image = "";
        }
        return box;
      });
      res.json(updatedboxes);
  }).catch(err => {
    console.log(err);
  })
}

exports.getBoxesForBoxTypeProducts = (req, res) => {
  const boxTypeProducts = "products";
  Box.find({boxType : boxTypeProducts})
  .then(boxes => {
      const updatedboxes = boxes.map(box => {
        if (box.image && box.image.indexOf("upload") === -1 && box.image.indexOf("src") === -1 && box.image.indexOf("image") === -1) {
          box.image = `${req.protocol}://${req.get("host")}/image/${box.image}`;
        } else {
          box.image = "";
        }
        return box;
      });
      res.json(updatedboxes);
  }).catch(err => {
    console.log(err);
  })
}


// exports.postBox = async (req, res) => {
//   const title = req.body.boxtitle;
//   const stock = req.body.stock;
//   const boxType = req.body.boxType;

//   const existingBox = await Box.findOne({ title: title });
//   if (existingBox) {
//     console.log("box is already exist");
//     return res.json("exists");
//   }

//   const box = new Box();
//   if (title) {
//     box.title = title;
//   }
//   if (req.files && req.files.length > 0) {
//     const images = [];
//     req.files.forEach(file => images.push(file.filename));
//     box.image = images.join(",");
//   } else {
//     console.log("no image provided");
//   }

//   console.log('Stock:', stock);


//   if (stock.length > 0) {
//     for (let i = 0; i < stock.length; i++) {
//       let images = stock[i].images.split(",");
//       images = images.map(i => i.split("images/")[1]);
//       stock[i].images = images.join(",");
//     }
//     box.stock = stock;
//   }
//   if (boxType) {
//     box.boxType = boxType;
//   }
//   await box.save();
//   res.json("saved");
// };


exports.postBox = async (req, res) => {
  const title = req.body.boxtitle;
  let stock = req.body.stock;
  let stockForProducts = req.body.stockForProducts;
  const boxType = req.body.boxType;

  console.log("Received stock data type:", typeof stock);
  console.log("Received stock data:", stock);

  const existingBox = await Box.findOne({ title: title });
  if (existingBox) {
    console.log("Box already exists");
    return res.json("exists");
  }

  const box = new Box();
  if (title) {
    box.title = title;
  }
  if (req.files && req.files.length > 0) {
    const images = [];
    req.files.forEach(file => images.push(file.filename));
    box.image = images.join(",");
  } else {
    console.log("No image provided");
  }

  if (stock) {
    if (typeof stock === 'string') {
      try {
        stock = JSON.parse(stock);
      } catch (error) {
        console.error("Error parsing stock JSON:", error);
        return res.status(400).json("Invalid stock format");
      }
    }
    if (Array.isArray(stock) && stock.length > 0) {
      const updatedStock = stock.map(item => {
        if (item.images && typeof item.images === 'string') {
          let images = item.images.split(",");
          images = images.map(image => image.split("images/")[1]);
          item.images = images.join(",");
        } else {
          console.log(`No valid images provided for stock item with code ${item.code}`);
        }
        return item;
      });
      box.stock = updatedStock;
    } else {
      console.log("Stock is not an array or is empty");
    }
  } else {
    console.log("Stock array is empty or undefined");
  }

  if (boxType) {
    box.boxType = boxType;
  }

  if(stockForProducts) {
        if (typeof stockForProducts === 'string') {
      try {
        stockForProducts = JSON.parse(stockForProducts);
      } catch (error) {
        console.error("Error parsing stockForProducts JSON:", error);
        return res.status(400).json("Invalid stockForProducts format");
      }
    }
    if (Array.isArray(stockForProducts) && stockForProducts.length > 0) {
      const updatedstockForProducts = stockForProducts.map(item => {
        if (item.images && typeof item.images === 'string') {
          let images = item.images.split(",");
          images = images.map(image => image.split("images/")[1]);
          item.images = images.join(",");
        } else {
          console.log(`No valid images provided for stockForProducts item with code ${item.code}`);
        }
        return item;
      });
      box.stockForProducts = updatedstockForProducts;
    } else {
      console.log("Stock is not an array or is empty");
    }
  }

  try {
    await box.save();
    res.json("saved");
  } catch (error) {
    console.error("Error saving box:", error);
    res.status(500).json("error");
  }
};



exports.getProductsByTitle = (req, res, next) => {
  const title = req.params.title;

  Box.find({ title: title })
    .then(boxes => {
      let updatedBoxes = boxes.map(box => {
        if(box.boxType === "products") {
        // Update box image
        if (box.image && box.image.indexOf("upload") === -1 && box.image.indexOf("src") === -1 && box.image.indexOf("image") === -1) {
          box.image = `${req.protocol}://${req.get("host")}/images/${box.image}`;
        } else {
          box.image = "";
        }

        // Update images in the stock array of each slider
        let updatedStockForProducts = box.stockForProducts.map(product => {
            if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
              product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
            } else {
              product.images = "";
            }
            return product;
        });
        return {
          title: box.title,
          image: box.image,
          boxType: box.boxType, // Include boxType in the response
          stockForProducts: updatedStockForProducts,
        };
        } else if (box.boxType === "sliders") {
        // Update box image
        if (box.image && box.image.indexOf("upload") === -1 && box.image.indexOf("src") === -1 && box.image.indexOf("image") === -1) {
          box.image = `${req.protocol}://${req.get("host")}/images/${box.image}`;
        } else {
          box.image = "";
        }

        // Update images in the stock array of each slider
        let updatedStock = box.stock.map(slider => {
          let updatedSliderStock = slider.stock.map(product => {
            if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
              product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
            } else {
              product.images = "";
            }
            return product;
          });

          return {
            ...slider,
            stock: updatedSliderStock
          };
        });

        return {
          title: box.title,
          image: box.image,
          boxType: box.boxType, // Include boxType in the response
          stock: updatedStock,
        };
    }});
      res.json(updatedBoxes);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "An error occurred" });
    });
};


// exports.deleteBox = async (req, res) => {
//   const title = req.params.title;
//   const existingBox = await Box.findOne({title : title});
//   if (existingBox.boxType === "products") {
//     Box.findOneAndDelete({ title })
//     .then(result => {
//       res.json("deleted");
//       console.log("SLIDER DELETED SUCCESSFULLY!");
//     })
//     .catch(err => {
//       console.log(err);
//     });
//   } else if(existingBox.boxType === "sliders"){
//     existingBox.stock.filter(slider => slider)
//   }

// };


exports.deleteBox = async (req, res) => {
  const title = req.params.title;

  try {
    const existingBox = await Box.findOne({ title });
    if (!existingBox) {
      return res.status(404).json({ message: "Box not found" });
    }

    if (existingBox.boxType === "products") {
      await Box.findOneAndDelete({ title });
      console.log("Box deleted successfully!");
      return res.json("deleted");
    } else if (existingBox.boxType === "sliders") {
      const sliderTitles = existingBox.stock.map(slider => slider.title);

      for (const sliderTitle of sliderTitles) {
        await Slider.findOneAndDelete({ title: sliderTitle });
      }
      console.log("Sliders deleted successfully!");

      await Box.findOneAndDelete({ title });
      console.log("Box deleted successfully!");
      return res.json("deleted");
    }  else {
      return res.status(400).json({ message: "Invalid box type" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};