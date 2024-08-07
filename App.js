require('dotenv').config();
const express = require("express");
const path = require('path')
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStoreSession = require("connect-mongodb-session")(session);
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const db = require('./util/database')

const Routes = require("./routes/Routes");
const ProductController = require("./controllers/ProductController");
const upload = require("./middleware/upload");
const Guest = require('./models/guestSchema');
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.veahqoj.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const mongoStore = new MongoStoreSession({
  uri: MONGODB_URI,
  collection: "sessions",
});

const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'https://194.164.72.238',
  'https://soccercornersports.com',
  'https://www.soccercornersports.com',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);  // Allow requests with no origin (like mobile apps or curl requests)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};




app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({ secret: "supersupersecret", resave: false, saveUninitialized: false, store: mongoStore, cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "../build")));

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader(
//     'Access-Control-Allow-Methods',
//     'OPTIONS, GET, POST, PUT, PATCH, DELETE'
//   );
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });
// Force set CORS headers for all responses
// app.use((req, res, next) => {
//   const origin = req.get('Origin');
//   if (allowedOrigins.includes(origin)) {
//     res.header('Access-Control-Allow-Origin', origin);
//     res.header('Access-Control-Allow-Credentials', 'true');
//   }
//   next();
// });

app.use(Routes);


app.get("/initialize-session", async (req, res, next) => {
  if (!req.session.guestId) {
    function generateGuestId() {
      return Date.now() + Math.floor(Math.random() * 1000);
    }
    const GuestId = generateGuestId();
    const guest = new Guest({
      cart: [],
      guestId: GuestId,
    });
    req.session.guestId = GuestId;
    // const token = jwt.sign(
    //   {
    //     guestIdd: GuestId,
    //   },
    //   "somesupersecretsecret",
    //   { expiresIn: "10s" }
    // );
    await guest.save();
    console.log("New session created for guest:", guest);
    return res.status(200).json({ guestID: GuestId });
  } else {
    console.log("Session already exists");
    // res.json('session already exists');
    const GuestId = req.session.guestId;
    return res.json({ guestID: GuestId });

  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});



mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 3001);
    console.log(`server running in port ${process.env.PORT}`);
  })
  .catch(err => {
    console.log(err);
  });

