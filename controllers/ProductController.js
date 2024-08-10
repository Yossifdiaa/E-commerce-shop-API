const NameOfCollection = require("../models/NavBarSchema");
const Brands = require("../models/BrandSchema");
const ProductModel = require("../models/ProductSchema");
const Archive = require("../models/ArchiveSchema");
const Order = require("../models/NewOrdersSchema");
const {Slider} = require("../models/sliderSchema");
const Box = require("../models/HomeBoxSchema");
const Guest = require("../models/guestSchema");
// const db = require('../util/database')





exports.getByBrandName = (req, res) => {
  const brand = req.params.brand;

  ProductModel.find({ brand: brand })
    .then(products => {
      // Assuming products have an 'images' field which stores filenames
      const updatedProducts = products.map(product => {
        // Append the host and filename to the image path
        if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
          product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
        } else {
          product.images = "";
        }
        return product;
      });
      res.json(updatedProducts);
    })
    .catch(err => {
      console.log(err);
    });
};



exports.getProducts = (req, res, next) => {
  ProductModel.find()
    .then(products => {
      // Assuming products have an 'images' field which stores filenames
      const updatedProducts = products.map(product => {
        // Append the host and filename to the image path
        if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
          product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
        } else {
          product.images = "";
        }
        return product;
      });
      res.json(updatedProducts);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error retrieving products");
    });
};

// exports.getProducts = (req , res , next) => {
//   db.execute('SELECT * FROM products')
//   .then(result => {
//     console.log(result[0]);
//     res.json(result[0]);
//   }).catch(err => {
//     console.log(err);
//   });
// }



exports.getOrders = (req, res, next) => {
  Order.find()
    .then(orders => {
      // Append the host and filename to the image path if not already complete
      const updatedOrders = orders.map(order => {
        order.productsOrdered = order.productsOrdered.map(product => {
          if (product.images && product.images.indexOf("http") === -1) {
            product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
          }
          return product;
        });
        return order;
      });
      res.json(updatedOrders);
    })
    .catch(err => {
      console.log(err);
    });
};
exports.postOrder = async (req, res, next) => {
  const name = req.body.name;
  const zone = req.body.zone;
  const area = req.body.area;
  const phone = req.body.phone;
  const address = req.body.address;
  const note = req.body.note;
  const email = req.body.email; // Assuming email is passed in the request body
  const date = new Date();

  if (!email) {
    console.log("Missing email address in the request body");
    return res.status(400).json({ error: "Missing email address" });
  }

  function generateOrderNumber() {
    return Date.now().toString() + Math.floor(Math.random() * 1000);
  }
  const orderNumber = generateOrderNumber();
  
  try {
  const GuestId = req.params.guestId;
  const guest = await Guest.findOne({ guestId : GuestId });

  if (!guest) {
    console.log("Guest not found");
    return res.status(404).json("Guest not found");
  }

  if (guest.cart.length === 0) {
    console.log("Cart is empty");
    return res.status(400).json("Cart is empty");
  }

  const productsData = guest.cart.map(item => ({
    code: item.code,
    image: item.images,
    size: item.size,
    quantity: item.quantity,
    price: item.price,
    images : item.images,
  }));

  const totalPrice = productsData.reduce((total, product) => {
    return total + (product.price * product.quantity);
  }, 0);

  const totalPriceWithShipping = totalPrice + 50;


  const order = new Order({
    orderId: orderNumber,
    name: name,
    email: email,
    area: area,
    zone: zone,
    phone: phone,
    address: address,
    note: note,
    productsOrdered: productsData,
    date: date,
    TotalPrice: totalPriceWithShipping,
  });



  await order.save();
  guest.orders.push(order);
  await guest.save();


  for (const product of productsData) {
    let productInDB = await ProductModel.findOne({ code: product.code });
    const sliders = await Slider.find({ 'stock.code': product.code });
    for (const slider of sliders) {
      const stockProduct = slider.stock.find(item => item.code === product.code);
      if (stockProduct) {
        const productSizeObj = stockProduct.sizes.find(size => size.size === product.size);
        if (productSizeObj) {
          productSizeObj.quantity -= product.quantity;
          console.log(`Slider product size decreased and became ${productSizeObj.quantity}`);
        } else {
          console.log(`Size ${product.size} not found in stock for product code ${product.code} in slider ${slider.title}`);
        }
      } else {
        console.log(`Product with code ${product.code} not found in slider stock for slider ${slider.title}`);
      }
      await slider.save();
    }
    const boxes = await Box.find({ 'stock.code': product.code });
    for (const box of boxes) {
      const stockProduct = box.stock.find(item => item.code === product.code);
      if (stockProduct) {
        const productSizeObj = stockProduct.sizes.find(size => size.size === product.size);
        if (productSizeObj) {
          productSizeObj.quantity -= product.quantity;
          console.log(`box product size decreased and became ${productSizeObj.quantity}`);
        } else {
          console.log(`Size ${product.size} not found in stock for product code ${product.code} in box ${box.title}`);
        }
      } else {
        console.log(`Product with code ${product.code} not found in box stock for box ${box.title}`);
      }
      await box.save();
    }
    if (!productInDB) {
      console.log(`Product with code ${product.code} not found in the DB`);
       res.status(404).json(`Product with code ${product.code} not found in the DB`);
    }

    if (typeof productInDB.sizes === 'string') {
      productInDB.sizes = JSON.parse(productInDB.sizes);
    }

    const sizeObj  = productInDB.sizes.find(size => size.size === product.size);

    if (!sizeObj) {
      console.log(`Selected size ${product.size} not found in product sizes for code ${product.code}`);
       res.status(400).json(`Selected size ${product.size} not found in product sizes for code ${product.code}`);
    }


    sizeObj.quantity -= product.quantity;
    console.log(`size in ProductModel decreased and become ${sizeObj.quantity}`);
    try {
      await productInDB.save()
      .then(result => {
      });
    } catch (saveError) {
      console.error(`Error saving product ${product.code}:`, saveError);
      return res.status(500).json({ error: `Error saving product ${product.code}` });
    }

  }


    guest.cart = [];
    await guest.save();

    console.log("Order saved and email sent:", order);
    res.json("saved");
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getOrdersOfGuest = async (req, res , next) => {
  const guestId = req.session.guestId;

  if (!guestId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const guest = await Guest.findOne({ guestId });
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found.' });
    }
    res.json(guest.orders);
  } catch (error) {
    console.error("Error retrieving orders:", error.message);
    return res.status(500).json("Internal Server Error");
  }
}

exports.deleteOrder = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findOneAndDelete({ orderId: orderId })
    .then(result => {
      res.json("order deleted successfully");
      console.log("order deleted successfully");
    })
    .catch(err => {
      console.log(err);
    });
};

exports.deleteOneOrderForClient = async (req, res) => {
  const GuestId = req.session.guestId;
  const orderId = req.params.orderId;

  try {
    const guest = await Guest.findOne({ guestId: GuestId });

    if (!guest) {
      console.log("Guest not found");
      return res.status(404).json("Guest not found");
    }

    // Filter out the order with the given orderId
    guest.orders = guest.orders.filter(order => order.orderId.toString() !== orderId);
    // Save the updated guest document
    await guest.save();

    console.log(`Order with ID ${orderId} deleted for guest ${GuestId}`);
    res.json("Order deleted successfully");
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.deleteOneProductFromNewOrder = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const productCode = req.params.code;

  // find the order and delete the product
  const order = await Order.findOne({ orderId: orderId });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  const productToDelete = order.productsOrdered.find(prod => prod._id.toString() === productId);
  if (!productToDelete) {
    return res.status(404).json({ message: "Product not found in order" });
  }

  // Retrieve the quantity of the product from the cart
  const quantityOrdered = productToDelete.quantity;

  // Remove the product from the order
  order.productsOrdered = order.productsOrdered.filter(prod => prod._id.toString() !== productId);
  await order.save();

  console.log("Product deleted successfully from order");
  res.json("Product deleted successfully from order");

  // Return the quantity to the stock
  const productInDB = await ProductModel.findOne({ code: productCode });
  if (!productInDB) {
    return res.status(404).json({ message: "Product not found in database" });
  }
  // Ensure that the returned quantity is added to the existing quantity in the stock without concatenation
  productInDB.quantity = Number(productInDB.quantity) + Number(quantityOrdered);
  await productInDB.save();
  console.log("product quantity returned to stock");

  // check if the order has 0 products delete it

  if (order.productsOrdered.length === 0) {
    await Order.findOneAndDelete({ orderId: orderId });
    console.log("Order deleted because it has 0 product.");
  }
};

exports.deleteAllOrders = (req, res, next) => {
  Order.deleteMany()
    .then(result => {
      res.json("orders deleted successfully");
      console.log("orders deleted successfully");
    })
    .catch(err => {
      console.log(err);
    });
};

exports.returnsStatus = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const existOrderInArchive = await Archive.findOne({ orderId: orderId });
  const productSelected = existOrderInArchive.productsOrdered.find(prod => prod._id.toString() === productId);
  productSelected.status = "returns";
  await existOrderInArchive.save();
  console.log("product status is now returns");
  res.status(200).json('product status is now returns');
};

exports.moneyCollectedStatus = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const existOrderInArchive = await Archive.findOne({ orderId: orderId });
  const productSelected = existOrderInArchive.productsOrdered.find(prod => prod._id.toString() === productId);
  productSelected.status = "moneyCollected";
  await existOrderInArchive.save();
  console.log("product status is now moneyCollected");
  res.status(200).json('product status is now moneyCollected');
};

exports.deliveredStatus = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const existOrderInArchive = await Archive.findOne({ orderId: orderId });
  const productSelected = existOrderInArchive.productsOrdered.find(prod => prod._id.toString() === productId);
  productSelected.status = "delivered";
  await existOrderInArchive.save();
  console.log("product status is now delivered");
  res.status(200).json('product status is now delivered');
};

exports.outForDeliveryStatus = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const existOrderInArchive = await Archive.findOne({ orderId: orderId });
  const productSelected = existOrderInArchive.productsOrdered.find(prod => prod._id.toString() === productId);
  productSelected.status = "outForDelivery";
  await existOrderInArchive.save();
  console.log("product status is now outForDelivery");
  res.status(200).json('product status is now outForDelivery');
};

exports.getArchive = (req, res, next) => {
  Archive.find()
    .then(products => {
      // Assuming products have an 'images' field which stores filenames
      const updatedProducts = products.map(product => {
        // Append the host and filename to the image path
        if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
          product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
        } else {
          product.images = "";
        }
        return product;
      });
      res.json(updatedProducts);
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postToArchive = async (req, res, next) => {
  const orderId = req.params.orderId;
  const existOrderInArchive = await Archive.findOne({ orderId: orderId });
  const orderInOrdersCollection = await Order.findOne({ orderId: orderId });

  if (existOrderInArchive) {
    console.log("order already exist in archive ");
    return res.json("order already exist in archive");
  }

  const OrderToArchive = new Archive({
    orderId: orderInOrdersCollection.orderId,
    name: orderInOrdersCollection.name,
    phone: orderInOrdersCollection.phone,
    area: orderInOrdersCollection.area,
    zone: orderInOrdersCollection.zone,
    productsOrdered: orderInOrdersCollection.productsOrdered,
  });
  await OrderToArchive.save();
  console.log("order saved in archive", OrderToArchive);
  res.status(200).json('order saved in archive');
};

exports.postAllToArchive = async (req, res, next) => {
  try {
    // Retrieve all orders from the order collection
    const ordersInOrdersCollection = await Order.find();

    // Iterate through each order and save it to the archive collection
    for (const order of ordersInOrdersCollection) {
      const orderId = order.orderId;

      // Check if the order with the given orderId already exists in the archive
      const existOrderInArchive = await Archive.findOne({ orderId: orderId });

      if (existOrderInArchive) {
        console.log(`order already exists in archive`);
        continue; // Skip to the next order
      }

      // Create a new Archive entry using details from the order in orders
      const orderToArchive = new Archive({
        orderId: order.orderId,
        name: order.name,
        phone: order.phone,
        area: order.area,
        zone: order.zone,
        productsOrdered: order.productsOrdered,
      });

      // Save the new Archive entry
      await orderToArchive.save();

      console.log(`order ${orderId} saved in archive`);
    }

    console.log("All orders saved in archive");
    return res.json("All  orders saved in archive");
  } catch (error) {
    console.error("Error in postAllToArchive:", error.message);
    return res.status(500).json("Internal Server Error");
  }
};

exports.deleteOneProductFromOrderInArchive = async (req, res, next) => {
  const productId = req.params.productId;
  const orderId = req.params.orderId;
  const order = await Archive.findOne({ orderId: orderId });
  order.productsOrdered = order.productsOrdered.filter(prod => prod._id.toString() !== productId);
  await order.save();
  console.log("product deleted succesfully");
};

exports.deleteOrderFromArchive = (req, res, next) => {
  const orderId = req.params.orderId;
  Archive.findOneAndDelete({ orderId: orderId })
    .then(result => {
      res.json("order from archive deleted successfully");
      console.log("order from archive deleted successfully");
    })
    .catch(err => {
      console.log(err);
    });
};

exports.deleteAllOrdersFromArchive = (req, res, next) => {
  Archive.deleteMany()
    .then(result => {
      res.json("orders from archive deleted successfully");
      console.log("orders from archive deleted successfully");
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCollection = (req, res, next) => {
  const collectionName = req.params.collectionName;
  ProductModel.find({ collectionName })
    .then(products => {
      // Assuming products have an 'images' field which stores filenames
      const updatedProducts = products.map(product => {
        // Append the host and filename to the image path
        if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
          product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
        } else {
          product.images = "";
        }
        return product;
      });
      res.json(updatedProducts);
    })
    .catch(err => {
      console.log(err);
    });
};



exports.getSingleProduct = (req, res, next) => {
  const code = req.params.code;
  ProductModel.findOne({ code })
    .then(product => {
      if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
        product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
      } else {
        product.images = "";
      }
      res.json(product);
    })
    .catch(err => {
      res.json(err);
    });
};




exports.getCollectionsNames = (req, res, next) => {
  NameOfCollection.find()
    .then(collectionNames => {
      res.json(collectionNames);
    })
    .catch(err => {
      console.log(err);
    });
};
exports.postCollectionName = async (req , res) => {
  const collectionName = req.params.collectionName;
  const existingCollectionName = await NameOfCollection.findOne({ Name : collectionName }); 
  if(existingCollectionName){ 
    console.log('collectionName already exist');
    return res.json('collectionName already exist');
  } else {
    const newCollectionName = new NameOfCollection({
      Name : collectionName
    });
    await newCollectionName.save();
    res.status(200).json('collectionName saved')
    console.log('collectionName saved');
  }
 }

exports.getBrands = (req, res, next) => {
  Brands.find()
    .then(brands => {
      res.json(brands);
    })
    .catch(err => {
      console.log(err);
    });
};
exports.postBrand = async (req , res) => {
  const brand = req.params.brand;
  const existingBrand = await Brands.findOne({ Brand : brand }); 
  if(existingBrand){ 
    console.log('brand already exist');
    return res.json('brand already exist');
  } else {
    const newBrand = new Brands({
      Brand : brand
    });
    await newBrand.save();
    res.status(200).json('brand saved')
    console.log('brand saved');
  }
 }

// => POST

exports.postAddProduct = async (req, res, next) => {
  const { code, brand, newCollection, sale, collectionName, price, description, sizes, sliders, boxes } = req.body;

  // const userId = req.userId;
  // let creator;
  // => CHECK IF PRODUCT EXIST



  if (code) {
    const existingProduct = await ProductModel.findOne({ code });
    if (existingProduct) {
      console.log("Product is already exist ");
      return res.json("product already exist");
    }
  } else {
    console.log(" no code provided");
    return res.json(" no code provided");
  }

  
  // add the product in the database
  const product = new ProductModel();
  if (code) {
    product.code = code;
  }
  if (collectionName) {
    product.collectionName = collectionName;
  }
  if (price) {
    product.price = price;
  }
  if (description) {
    product.description = description;
  }
  if (sale) {
    product.sale = sale;
  }
  if (newCollection) {
    product.newCollection = newCollection;
  }
  if (brand) {
    product.brand = brand;
  }
  if (sizes) {
    const sizesAsAnArray = JSON.parse(sizes);
    product.sizes = sizesAsAnArray;
  }
  // if (req.file) {
  //   const tempPath = path.join('uploads', `temp_${req.file.filename}`);
  //   imageProcessingQueue.add({ filePath: req.file.path, tempPath });
  //   product.images = req.file.filename;
  // } else {
  //   console.log("No image provided");
  // }
  if (req.files && req.files.length > 0) {
    const images = [];
    req.files.forEach(file => images.push(file.filename));
    product.images = images.join(",");
  } else {
    console.log("no image provided");
  }
  if (sliders && sliders.length > 0) {
    const sliderssAnArray = JSON.parse(sliders);

    for (const sliderTitle of sliderssAnArray) {
      try {
        // Find the slider by its title
        let slider = await Slider.findOne({ title: sliderTitle });
        if (slider) {
          // Push the product into the slider's stock array
          slider.stock.push(product);
          await slider.save();
        } else {
          console.log(`Slider with title ${sliderTitle} not found`);
          continue;
        }
    
        // Find the box that contains the slider with the given title
        let box = await Box.findOne({ "stock.title": sliderTitle });
        if (box) {
          // Find the slider within the box's stock array and push the product into its stock array
          let sliderInBox = box.stock.find(slider => slider.title === sliderTitle);
          if (sliderInBox) {
            sliderInBox.stock.push(product);
            await box.save();
          } else {
            console.log(`Slider with title ${sliderTitle} not found in any box`);
          }
        } else {
          console.log(`Box containing slider with title ${sliderTitle} not found`);
        }
      } catch (error) {
        console.log(`Error processing slider with title ${sliderTitle}:`, error);
      }
    }
  }

  if (boxes && boxes.length > 0) {
    const boxessAnArray = JSON.parse(boxes);

    for (const boxTitle of boxessAnArray) {
      let box = await Box.findOne({ title: boxTitle });
      box.stockForProducts.push(product);
      await box.save();
    }
  }

  await product.save();

  // => CHECK IF THE COLLECTIONNAME EXIST
  if (collectionName) {
    const existingCollectionName = await NameOfCollection.findOne({
      Name: collectionName,
    });

    if (existingCollectionName) {
      console.log("collectionName is already exist");
    } else {
      const newNameOfCollection = new NameOfCollection({
        Name: collectionName,
      });
      await newNameOfCollection.save();
      console.log("New collectionName added:", newNameOfCollection);
    }
  }



  // =>  CHECK IF THE BRANDNAME EXIST

  if (brand) {
    const existingBrandName = await Brands.findOne({ Brand: brand });

    if (existingBrandName) {
      console.log("BrandName is already exist");
    } else {
      const newBrandName = new Brands({
        Brand: brand,
      });
      await newBrandName.save();
      console.log("New Brandname added:", newBrandName);
    }
  }

  res.json("saved");
  console.log("New product added:", product);
};




// => EDIT

exports.editProduct = async (req, res, next) => {
  const code = req.params.code;
  const UpdatedCode = req.body.code;
  const UpdatedBrandName = req.body.brand;
  const UpdatedSale = req.body.sale;
  const UpdatedCollectionName = req.body.collectionName;
  const UpdatedPrice = req.body.price;
  const UpdatedSizes = req.body.sizes;
  const UpdatedDescription = req.body.description;
  const sizesAsAnArray = JSON.parse(UpdatedSizes);
  ProductModel.findOneAndUpdate(
    { code },
    {
      code: UpdatedCode,
      collectionName: UpdatedCollectionName,
      brand: UpdatedBrandName,
      sale: UpdatedSale,
      price: UpdatedPrice,
      sizes: sizesAsAnArray,
      description: UpdatedDescription,
    }
  ).then(newProduct => {
    res.status(200).json(newProduct)
    console.log('product Edited successfully');
  }).catch(err => {
    console.log(err);
  })

  // if (req.files && req.files.length > 0) {
  //   const images = [];
  //   req.files.forEach(file => images.push(file.filename));
  //   editedProduct.images = images.join(",");
  // } else {
  //   console.log("no image provided");
  // }
  // if (UpdatedSliders && UpdatedSliders.length > 0) {
  //   const UpdatedSlidersAnArray = JSON.parse(UpdatedSliders);

  //   for (const sliderTitle of UpdatedSlidersAnArray) {
  //     let slider = await Slider.findOne({ title: sliderTitle });
  //     slider.stock.push(editedProduct);
  //     await slider.save();
  //   }
  // }
  // if (UpdatedBoxes && UpdatedBoxes.length > 0) {
  //   const UpdatedBoxesAnArray = JSON.parse(UpdatedBoxes);

  //   for (const boxTitle of UpdatedBoxesAnArray) {
  //     let box = await Box.findOne({ title: boxTitle });
  //     box.stock.push(editedProduct);
  //     await box.save();
  //   }
  // }

  // await editedProduct.save();

  // if (UpdatedCollectionName) {
  //   const existingCollectionName = await NameOfCollection.findOne({
  //     Name: UpdatedCollectionName,
  //   });

  //   if (existingCollectionName) {
  //     console.log("UpdatedCollectionName is already exist");
  //   } else {
  //     const newNameOfCollection = new NameOfCollection({
  //       Name: UpdatedCollectionName,
  //     });
  //     await newNameOfCollection.save();
  //     console.log("New UpdatedCollectionName added:", newNameOfCollection);
  //   }
  // }



  // // =>  CHECK IF THE BRANDNAME EXIST

  // if (UpdatedBrandName) {
  //   const existingBrandName = await Brands.findOne({ Brand: UpdatedBrandName });

  //   if (existingBrandName) {
  //     console.log("BrandName is already exist");
  //   } else {
  //     const newBrandName = new Brands({
  //       Brand: UpdatedBrandName,
  //     });
  //     await newBrandName.save();
  //     console.log("New Brandname added:", newBrandName);
  //   }
  // }



  // res.status(200).json("product edited successfully");
  // console.log("product edited successfully");
};

// => DELETE

exports.deleteSingleProduct = async (req, res, next) => {
  const code = req.params.code;
  // in sliders
  try {
    // In sliders
    const sliders = await Slider.find();
    for (const slider of sliders) {
      slider.stock = slider.stock.filter(product => product.code !== code);
      await slider.save();
    }
    console.log("Product in sliders deleted successfully");

    // In boxes
    const boxes = await Box.find();
    for (const box of boxes) {
      if (box.boxType === "sliders") {
        box.stock = box.stock.map(slider => {
          slider.stock = slider.stock.filter(product => product.code !== code);
          return slider;
        });
        console.log("Product in box for sliders deleted successfully");
      } else if (box.boxType === "products") {
        box.stockForProducts = box.stockForProducts.filter(product => product.code !== code);
        console.log("Product in box for products deleted successfully");
      }
      await box.save();
    }
    console.log("Product in box deleted successfully");

    // In stock
    await ProductModel.findOneAndDelete({ code });
    console.log("Product deleted successfully in stock");

    res.status(200).json("PRODUCT DELETED SUCCESSFULLY IN STOCK, SLIDERS, AND BOXES!");

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "An error occurred while deleting the product" });
  }
};

exports.deleteAllProducts = async (req, res, next) => {
  try {
    // In sliders
    const sliders = await Slider.find();
    for (const slider of sliders) {
      slider.stock = [];
      await slider.save();
    }
    console.log("All products in sliders deleted successfully");

    // In boxes
    const boxes = await Box.find();
    for (const box of boxes) {
      if (box.boxType === "sliders") {
        box.stock = box.stock.map(slider => {
          slider.stock = [];
          return slider;
        });
        console.log("All products in box for sliders deleted successfully");
      } else if (box.boxType === "products") {
        box.stockForProducts = [];
        console.log("All products in box for products deleted successfully");
      }
      await box.save();
    }
    console.log("All products in boxes deleted successfully");

    // In stock
    await ProductModel.deleteMany({});
    console.log("All products deleted successfully in stock");

    res.status(200).json("ALL PRODUCTS DELETED SUCCESSFULLY FROM STOCK, SLIDERS, AND BOXES!");

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "An error occurred while deleting all products" });
  }
};


