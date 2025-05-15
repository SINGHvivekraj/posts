const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const userModel = require("./models/user");
const postModel=require("./models/post")
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

      const token = jwt.sign({ email, userid: usercreated._id,name:usercreated.name }, "raazzz");
      res.cookie("tokenregister", token);
      res.redirect("/login");
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

    const token = jwt.sign({ email, userid: user._id ,name:user.name }, "raazzz");
    res.cookie("tokenlogin", token);
    res.redirect("/profile");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("tokenlogin", "");
  res.redirect("/login");
});

app.get("/tokensfind", (req, res) => {
  res.send(req.cookies);
});

app.get("/profile", isLoggedIn,async (req, res) => {
  //console.log(req.user);
  let user=await userModel.findOne({email:req.user.email}).populate('posts');
  res.render("profile",{curr_user:user});
});

app.post("/createpost", isLoggedIn, async (req, res) => {
  let user=await userModel.findOne({email:req.user.email});
  let post=await postModel.create({
    user:user._id,
    content:req.body.content
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
});

//protected routes using a middleware
function isLoggedIn(req, res, next) {
  if (req.cookies.tokenlogin === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.tokenlogin, "raazzz");
    req.user = data;
    next();
  }
}

app.listen(3000);
