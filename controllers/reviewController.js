const Reviews = require('../models/ReviewSchema')



exports.getReviews = (req ,res,next) => {
    Reviews.find()
    .then(reviews => {
      res.json(reviews)
    }).catch(err => {
      console.log(err);
    })
  };
  
  
  exports.postReviews = (req , res , next) => {
    const name = req.body.name;
    const message = req.body.message;
  
    const Review = new Reviews({
      name : name,
      message : message,
    })
    Review.save();
  
  }
  