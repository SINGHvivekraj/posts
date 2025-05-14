const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const userModel = require("./models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", (req, res) => {
  const { name, email, password, age } = req.body;
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const usercreated = await userModel.create({
        name,
        email,
        password: hash,
        age,
      });

      const token = jwt.sign({ email, userid: usercreated._id }, "raazzz");
      res.cookie("tokenregister", token);
      res.send("registered successfully!");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email: email });
  if (!user) return res.send("Something went wrong");

  bcrypt.compare(password, user.password, (err, result) => {
    if (!result) res.redirect("/login");

    const token = jwt.sign({ email, userid: user._id }, "raazzz");
    res.cookie("tokenlogin", token);
    res.send("Logged In Successfully");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("tokenlogin", "");
  res.redirect("/login");
});

app.get("/tokensfind", (req, res) => {
  res.send(req.cookies);
});

app.get("/profile", isLoggedIn, (req, res) => {
  console.log(req.user);
  res.send("Profile Page");
});

//protected routes using a middleware
function isLoggedIn(req, res, next) {
  if (req.cookies.tokenlogin === "") res.send("you must be logged in");
  else {
    let data = jwt.verify(req.cookies.tokenlogin, "raazzz");
    req.user = data;
    next();
  }
}

app.listen(3000);
