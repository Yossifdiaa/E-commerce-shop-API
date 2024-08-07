require('dotenv').config();
const express = require("express");
const ProductController = require("../controllers/ProductController");
const authController = require("../controllers/authController");
const footerController = require("../controllers/footerController");
const reviewController = require("../controllers/reviewController");
const SliderController = require("../controllers/sliderController");
const HomeBoxController = require("../controllers/HomeBoxController");
const CarouselImages = require("../controllers/CarouselImagesController");
const cartController = require('../controllers/cartController');
// const authMiddleware = require("../auth/is-auth");
const router = express.Router();
// const { upload } = require("../middleware/upload");
const upload  = require("../middleware/upload");



// => PRODUCTS IN HOME & STOCK
router.get("/api/products", ProductController.getProducts); // get all products
router.post("/api/products/add", upload.array("image"),  ProductController.postAddProduct);
router.delete("/api/products/delete/:code", ProductController.deleteSingleProduct); // delete single product
router.delete("/api/products/delete", ProductController.deleteAllProducts); // delete all products
router.put("/api/products/edit/:code", ProductController.editProduct); // edit Product by code
router.get("/api/products/code/:code", ProductController.getSingleProduct); // get single product
router.get("/api/products/collection/:collectionName", ProductController.getCollection); // get by collection
router.get("/api/products/collections/names", ProductController.getCollectionsNames); // Get collectionsNames
router.post('/api/products/addCollectionName/:collectionName' , ProductController.postCollectionName); // add collectionName
router.get("/api/products/getBrands", ProductController.getBrands); // get brands
router.post('/api/products/addBrand/:brand' , ProductController.postBrand);
router.get("/api/products/getByBrand/:brand", ProductController.getByBrandName); // get by brand

// Cart
router.get("/api/cart", cartController.getProductsOnCart);
router.post("/api/cart/add/:code/:guestId", upload.array("image"),  cartController.postProductsOnCart);
router.post("/api/cart/:code/increase/:guestId", cartController.increaseQuantity);
router.post("/api/:code/decrease/:guestId", cartController.decreaseQuantity);
router.delete("/api/cart/delete/:code", cartController.deleteProductFromCart);
router.delete("/api/cart/delete", cartController.deleteAllProductsFromCart);

// New Orders
router.get("/api/orders", ProductController.getOrders); // orders API
router.get('/api/myOrders' , ProductController.getOrdersOfGuest); // orders of guest 
router.delete('/api/deleteOneOrderForClient/:orderId' , ProductController.deleteOneOrderForClient);
router.post("/api/orders/add/:guestId", ProductController.postOrder); // post products on cart and Client info in the orders
router.delete("/api/orders/delete/:orderId", ProductController.deleteOrder); // delete one order
router.delete("/api/delete", ProductController.deleteAllOrders); // delete all orders
router.delete("/api/orders/delete/:orderId/:productId/:code", ProductController.deleteOneProductFromNewOrder); // delete one product from an order in NewOrders

// Archive
router.get("/api/archive", ProductController.getArchive); // archive API
router.post("/api/postToArchive/:orderId", ProductController.postToArchive); // post from orders to archive
router.get("/api/archive/deleteOrderFromArchive/:orderId", ProductController.deleteOrderFromArchive); // delete order from archive
router.get("/api/deleteProductFromOrderInArchive/:orderId/:productId", ProductController.deleteOneProductFromOrderInArchive); // delete one product from an order in Archive
router.get("/api/archive/deleteAllOrdersFromArchive", ProductController.deleteAllOrdersFromArchive); // delete orders from archive
router.post("/api/orderStatus/returns/:orderId/:productId", ProductController.returnsStatus); // returns status
router.post("/api/orderStatus/outForDelivery/:orderId/:productId", ProductController.outForDeliveryStatus); // out for delivery status
router.post("/api/orderStatus/delivered/:orderId/:productId", ProductController.deliveredStatus); // delivered status
router.post("/api/orderStatus/moneyCollected/:orderId/:productId", ProductController.moneyCollectedStatus); // money collected status
router.post("/api/postAllToArchive", ProductController.postAllToArchive); // post all orders to archive

// FOOTER ITEMS
router.get("/api/footerItems", footerController.getFooterItems);
router.get("/api/footerItems/:label", footerController.getSingleFooterItem); // get single product
router.post("/api/postFooterItem", footerController.postFooterItem); // post footerItem
router.get("/api/deleteFooterItem/:label", footerController.deleteFooterItem); // delete footerItem

// SLIDERS
router.get("/api/sliders", SliderController.getSliders);
router.get("/api/sliderProducts/:title", SliderController.getSliderByTitle);
router.post("/api/sliders/add", SliderController.postSlider);
router.delete("/api/sliders/delete/:title", SliderController.deleteSlider); // delete single slider

// HOME BOXES
router.get("/api/getProductsByTitle/:title", HomeBoxController.getProductsByTitle); // in homeboxes view
router.get("/api/homeBoxes", HomeBoxController.getBoxes); // in home
router.get("/api/getBoxesForBoxTypeSliders" , HomeBoxController.getBoxesForBoxTypeSliders); //in admin ddl
router.get("/api/getBoxesForBoxTypeProducts" , HomeBoxController.getBoxesForBoxTypeProducts); //in admin ddl
router.post("/api/postBox", upload.array("image" , 5),  HomeBoxController.postBox);
router.get("/api/boxes/delete-box/:title", HomeBoxController.deleteBox); // delete single box

// CAROUSEL IMAGES
router.get("/api/carousel", CarouselImages.getImages);
router.post("/api/carousel/add", upload.array("image"), CarouselImages.addImage);
router.get("/api/carousel/delete/:id", CarouselImages.deleteImage);

// AUTHENTICATION
// router.get("/auth-check", authMiddleware, authController.checkAuth);
router.get('/api/user' , authController.getUsers)
router.post("/api/auth/signUp", authController.signUp);
router.post("/api/auth/logIn", authController.logIn);
router.delete("/api/user/delete/:username", authController.deleteUser);
// router.get("/api/logOut", authController.logOut);
// router.post("/api/emailForResetPassword", authController.emailForResetPassword);
// router.post("/api/postNewPassword", authController.postNewPassword);

// // router.post('/api/auth/logOut' , authController.logOut) // logout API

// REVIEWS
router.get("/api/reviews", reviewController.getReviews);
router.post("/api/reviews", reviewController.postReviews);

// IMAGE SERVING
router.get("/images/:filename", (req, res) => {
  const options = {
    root: __dirname + "/../uploads/",
    dotfiles: "deny",
    headers: {
      "x-timestamp": Date.now(),
      "x-sent": true,
    },
  };

  const fileName = req.params.filename;
  res.sendFile(fileName, options, err => {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
  });
});

module.exports = router;
