const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/UserAdminSchema");


exports.signUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const username = req.body.username;

    // Check if user with the provided email already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      const error = new Error("User with this username already exists.");
      error.statusCode = 422;
      console.log("user already exist");
      throw error;
    }

    const password = req.body.password;
    // const zone = req.body.zone;
    // const area = req.body.area;
    // const phoneNumber = req.body.phoneNumber;
    // const address = req.body.address;

    // function generateIdNumber() {
    //   // Logic to generate a unique order number
    //   // For example, you can use a combination of current timestamp and a random number
    //   return Date.now().toString() + Math.floor(Math.random() * 1000);
    // }
    // const IdNumber = generateIdNumber();

    // Hash the password
    const hashedPw = await bcrypt.hash(password, 12);

    // Create a new user
    const user = new User({
      username: username,
      // userId: IdNumber,
      password: hashedPw,
      // name: name,
      // zone: zone,
      // area: area,
      // phoneNumber: phoneNumber,
      // address: address,
      // cart: [],
    });

    // Save the user to the database
    await user.save();

    console.log("User saved: ", user);
    res.status(201).json({ message: "User created successfully." });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};

exports.logIn = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    // Find the user by username
  User.findOne({ username })
  .then(user => {
    if (!user) {
      console.log("user not found");
      res.status(401).json('user not found');
    }
    bcrypt.compare(password, user.password)
      .then(isEqual => {
        if (!isEqual) {
          console.log("wrong password");
          res.status(401).json('wrong password');
        }
        console.log('is equal');
        function generateUserId() {
          return Date.now() + Math.floor(Math.random() * 1000);
        }
        const UserId = generateUserId();
        user.userId = UserId;
        const token = jwt.sign(
        {
          username: user.username,
          userId: UserId,
        },
        "somesupersecretsecret",
        { expiresIn: "8h" }
      );
      res.status(200).json({ token: token, userId: user.userId });
      }).catch(err => {
        console.log(err);
      })
  }).catch(err => {
    console.log(err);
  });
};

// exports.logOut = async (req, res) => {
//   try {
//     let GuestId = req.session.guestId;

//     // Check if GuestId is not found in session
//     if (!GuestId) {
//       // Attempt to get GuestId from JWT token (assuming it's passed in headers or body)
//       const token = req.headers.authorization.split(' ')[1]; // Assuming token is sent in Authorization header

//       if (!token) {
//         return res.status(401).json({ error: 'Unauthorized' });
//       }

//       // Verify token to get GuestId
//       const decodedToken = jwt.verify(token, "somesupersecretsecret");
//       GuestId = decodedToken.guestId;
//     }

//     // Check GuestId again to ensure it's valid
//     if (!GuestId) {
//       return res.status(404).json({ error: 'GuestId not found' });
//     }

//     // Delete guest document
//     const deletedGuest = await Guest.findOneAndDelete({ guestId: GuestId });

//     if (!deletedGuest) {
//       return res.status(404).json({ error: 'Guest not found' });
//     }

//     // Successfully logged out and deleted guest document
//     return res.status(200).json({ message: 'Guest logged out and document deleted' });
//   } catch (error) {
//     console.error('Error logging out:', error.message);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// exports.emailForResetPassword = async (req, res, next) => {
//   const email = req.body.email;
//   crypto.randomBytes(32, (err, buffer) => {
//     if (err) {
//       console.log(err);
//     }
//     const token = buffer.toString("hex");
//     User.findOne({ email: email })
//       .then(user => {
//         if (!user) {
//           return res.json("NoAccount");
//         }
//         user.resetToken = token;
//         user.resetTokenEpiration = Date.now() + 3600000;
//         return user.save();
//       })
//       .then(result => {
//         transporter.sendMail({
//           to: email,
//           from: "soccercornersports@gmail.com", // account for soccercorner
//           subject: "password reset",
//           html: `<p> you requested a password reset </p>
//            <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a>to set a new password click this </p>`,
//         }); // the link goes to a new page for changing the password after that redirect for the home
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   });
// };

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const email = req.body.email;
  const passwordToken = req.body.token;

  const existingUser = await User.findOne({ resetToken: passwordToken, resetTokenEpiration: { $gt: Date.now() }, email: email });
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  existingUser.password = hashedPassword;
  existingUser.resetToken = null;
  existingUser.resetTokenEpiration = undefined;

  await existingUser.save();
  console.log("password changed successfully");
};

exports.checkAuth = (req, res) => {
  res.status(200).json({ authenticated: true, userId: req.userId });
};

exports.getUsers = async (_req, res) => {
  User.find()
    .then(users => res.json(users))
    .catch(console.log);
};

exports.deleteUser = (req, res, next) => {
  const username = req.params.username;
  User.findOneAndDelete({ username })
    .then(result => {
      res.json("deleted");
    })
    .catch(err => {
      console.log(err);
    });
};
