const Guest = require('../models/guestSchema');
const ProductModel = require("../models/ProductSchema");




exports.postProductsOnCart = async (req, res, next) => {
  try {
    const code = req.params.code;
    const selectedSize = req.body.selectedSize;
    const existingProduct = await ProductModel.findOne({ code });

    if (!existingProduct) {
      console.log("Product not found in DB");
      return res.status(404).json("Product not found in DB");
    }


    const GuestId = req.params.guestId;
    const guest = await Guest.findOne({ guestId : GuestId });

    if (!guest) {
      console.log("Guest not found");
      return res.status(404).json("Guest not found");
    }

    const cartItem = guest.cart.find(item => item.code === code && item.size === selectedSize);

    if (!cartItem) {
      const productData = {
        code: existingProduct.code,
        brand: existingProduct.brand,
        collectionName: existingProduct.collectionName,
        price: existingProduct.price,
        size: selectedSize,
        sale: existingProduct.sale,
        quantity: 1,
        description: existingProduct.description,
        images: existingProduct.images,
      };


      guest.cart.push(productData);
      await guest.save();


      console.log("Product saved to guest's cart:", productData);
      return res.json("Product saved to cart");
    } else {
      console.log("Product already exists in the cart");
      return res.json("Product already exists in the cart");
    }
  } catch (error) {
    console.error("Error posting product on cart:", error.message);
    return res.status(500).json("Internal Server Error");
  }
};


exports.getProductsOnCart = async (req, res, next) => {
  const guestId = req.session.guestId;

  if (!guestId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const guest = await Guest.findOne({ guestId });
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    const Cart = guest.cart.map(product => {
      // Append the host and filename to the image path
      if (product.images && product.images.indexOf("upload") === -1 && product.images.indexOf("src") === -1 && product.images.indexOf("image") === -1) {
        product.images = `${req.protocol}://${req.get("host")}/images/${product.images}`;
      } else {
        product.images = "";
      }
      return product;
    })
    res.json(Cart);
  } catch (error) {
    console.error("Error retrieving cart:", error.message);
    return res.status(500).json("Internal Server Error");
  }
};


exports.increaseQuantity = async (req, res) => {
  const code = req.params.code;
  const GuestId = req.params.guestId;

  if (!GuestId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const guest = await Guest.findOne({guestId : GuestId });

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    const cartItemIndex = guest.cart.findIndex(item => item.code === code);

    if (cartItemIndex === -1) {
      console.log("Product not found in the guest's cart");
      return res.status(404).json("Product not found in the guest's cart");
    }

    const cartItem = guest.cart[cartItemIndex];
    const productInDB = await ProductModel.findOne({ code });

    if (!productInDB) {
      console.log("Product not found in the DB");
      return res.status(404).json("Product not found in the DB");
    }

    const sizeObj = productInDB.sizes.find(size => size.size === cartItem.size);

    if (cartItem.quantity < sizeObj.quantity) {
      cartItem.quantity = cartItem.quantity + 1;

      await guest.save();
      return res.status(200).json("Product quantity increased in cart");
    } else {
      console.log("out of stock");
      return res.status(400).json("out of stock");
    }
  } catch (error) {
    console.error("Error increasing quantity:", error.message);
    return res.status(500).json("Internal Server Error");
  }
};
  
exports.decreaseQuantity = async (req, res) => {
  const code = req.params.code;
  const GuestId = req.session.guestId;

  if (!GuestId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const guest = await Guest.findOne({ guestId : GuestId });

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    const cartItemIndex = guest.cart.findIndex(item => item.code === code);

    if (cartItemIndex === -1) {
      console.log("Product not found in the guest's cart");
      return res.status(404).json("Product not found in the guest's cart");
    }

    const cartItem = guest.cart[cartItemIndex];
    if (cartItem.quantity > 0) {
      cartItem.quantity -= 1;


      await guest.save();

      return res.json("Product quantity decreased in cart");
    } else {
      console.log("Product quantity in cart is already 0");
      return res.status(400).json("Product quantity in cart is already 0");
    }
  } catch (error) {
    console.error("Error decreasing quantity:", error.message);
    return res.status(500).json("Internal Server Error");
  }
};
  

exports.deleteProductFromCart = async (req, res, next) => {
  const code = req.params.code;
  const guestId = req.session.guestId;

  if (!guestId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const guest = await Guest.findOne({ guestId });

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    guest.cart = guest.cart.filter(item => item.code !== code);
    await guest.save();

    res.json("Product deleted from cart successfully");
    console.log("Product deleted from cart successfully");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};
  
exports.deleteAllProductsFromCart = async (req, res, next) => {
  const guestId = req.session.guestId;

  if (!guestId) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const guest = await Guest.findOne({ guestId });

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    guest.cart = [];
    await guest.save();

    res.json("All products deleted from cart successfully");
    console.log("All products deleted from cart successfully");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};