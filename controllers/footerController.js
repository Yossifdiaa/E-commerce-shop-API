const Footer = require("../models/footerSchema");

exports.getFooterItems = (req, res) => {
  Footer.find()
    .then(footerItems => {
      res.json(footerItems);
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getSingleFooterItem = (req, res) => {
  const label = req.params.label;
  Footer.findOne({ label })
    .then(item => {
      res.json(item);
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postFooterItem = async (req, res) => {
  const label = req.body.label;
  const content = req.body.content;

  const existingFooterItem = await Footer.findOne({ label: label });

  if (existingFooterItem) {
    console.log("footer already exist");
    return res.json("footer already exist");
  }

  const footer = new Footer();
  if (label) {
    footer.label = label;
  }
  if (content) {
    footer.content = content;
  }

  await footer.save();
  res.json("saved");
  console.log("new footer item added", footer);
};


exports.deleteFooterItem = (req, res , next) => {
  const label = req.params.label;
  Footer.findOneAndDelete({ label })
  .then(result => {
    res.json('deleted');
    console.log('footer deleted');
  }).catch(err => { 
    console.log(err);
  })
}
