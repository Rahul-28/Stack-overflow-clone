const express = require("express");
const LocalStorage = require("node-localstorage").LocalStorage;
var localStorage = new LocalStorage("./scratch");
const User = require("../models/User");

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
// const fetchuser = require('../middleware/fetchuser');
var jwt = require("jsonwebtoken");

const JWT_SECRET = "secret";

const router = express.Router();

router.post(
  "/createuser",
  [
    body("username", "Name Must have atleast 3 characters").isLength({
      min: 3,
    }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    // If there are errors return bad request and error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0]["msg"] });
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a user with this email already exist" });
      }
      user = await User.findOne({ username: req.body.username });

      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a user with this username already exist" });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: secPass,
      });

      const data = {
        user: {
          id: user.id,
          username: user.username,
        },
      };

      // console.log(data);
      const authtaken = jwt.sign(data, JWT_SECRET);

      localStorage.setItem("token", authtaken);
      localStorage.setItem("username", req.body.username);
      res.json({
        success: authtaken,
        username: req.body.username,
        date: user.date,
        userType: "user",
      });
      // res.json({ 'success': authtaken, 'username': req.body.username });
      // res.json({autotaken});
    } catch (err) {
      console.error(err.message);
      // res.status(500).send("Some error occured");
      res.status(400).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a password it can not be blank").exists(),
  ],
  async (req, res) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }

    // Using Destructuring method of javascript
    const { email, password } = req.body;

    try {
      if (!admin) {
        let user = await User.findOne({ email });

        if (!user) {
          return res
            .status(400)
            .json({ error: "Please Enter Correct login Credentials" });
        }

        const passwordCompare = await bcrypt.compare(password, user.password);

        if (!passwordCompare) {
          return res
            .status(400)
            .json({ error: "enter Correct login Credentials" });
        }

        const data = {
          user: {
            id: user.id,
            username: user.username,
          },
        };

        const authToken = jwt.sign(data, JWT_SECRET);
        //res.json({authToken});
        localStorage.setItem("token", authToken);
        localStorage.setItem("username", user.username);
        localStorage.setItem("since", user.date);

        req.body.authtoken = authToken;
        // req.body.userType = user.type;

        return res
          .status(200)
          .json({
            success: req.body.authtoken,
            username: user.username,
            userType: "user",
            date: user.date,
          });
      }

      localStorage.setItem("token", authToken);

      req.body.authtoken = authToken;
    } catch (error) {
      console.error(error.message);
      res.status(400).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
