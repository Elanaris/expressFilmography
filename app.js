//jshint esversion:6


// ---------- Modules ----------
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const nodemailer = require('nodemailer');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL);


// Mongoose User and Passport config
const userSchema = new mongoose.Schema ({
  username: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Mongoose Data, Category and Video Schemas
const dataSchema = new mongoose.Schema ({
  webName: String,
  footer: String,
  bgImage: String,
  infoText: String,
  previewsTitle: String,
  previewsMenu: String,
  contactTitle: String,
  contactText: String,
  aboutText: String,
  aboutImage: String,
  gear1Title: String,
  gear1Text: String,
  gear1Image: String,
  gear2Title: String,
  gear2Text: String,
  gear2Image: String,
  gear3Title: String,
  gear3Text: String,
  gear3Image: String,
  socialsTitle: String,
  socialsText: String,
  socialsFB: String,
  socialsYT: String,
  socialsIG: String
});

const Data = new mongoose.model("Data", dataSchema);

const videoSchema = new mongoose.Schema ({
  title: String,
  url: String
});

const Video = new mongoose.model("Video", videoSchema);

const categorySchema = new mongoose.Schema ({
  name: String,
  description: String,
  previewURL: String,
  orderNumber: Number,
  videos: [videoSchema]
});

const Category = new mongoose.model("Category", categorySchema);


// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// App Init
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

// Session Init
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// Passport Init
app.use(passport.initialize());
app.use(passport.session());


// ***************************** Functions *****************************
function handleError(res, err) {
  if (err) {
    console.log(err);
    res.redirect("/error");
  }
}

function findAndRender(res, ejsFile) {
  Category.find({}).sort("orderNumber").exec(function(err, foundCategories) {
    handleError(res, err);
    Data.findById(process.env.DATA_ID, function(error, foundData) {
      handleError(res, error);
      res.render(ejsFile, {categories: foundCategories, data: foundData});
    });
  });
}

function checkIfAdmin(req, res, callback) {
  if (req.isAuthenticated() && req.user._id == process.env.ADMIN_ID) {
    callback();
  } else {
    res.redirect("/login");
  }
}


// ***************************** Front Web Routes *****************************
app.get("/", function(req, res) {
  findAndRender(res, "home");
});

app.get("/about", function(req, res) {
  findAndRender(res, "about");
});

app.get("/videos", function(req, res) {
  findAndRender(res, "videos");
});

app.get("/sent", function(req, res) {
  findAndRender(res, "sent");
});

app.get("/error", function(req, res) {
  findAndRender(res, "error");
});


app.post("/contact", function(req, res) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: req.body.subject,
    text: `Jméno: ${req.body.name} \nEmail: ${req.body.email} \n\n${req.body.message}`
  };
  transporter.sendMail(mailOptions, function(error, info){
    handleError(res, err);
    res.redirect("/sent");
  });
});


// ***************************** Admin Routes *****************************
app.get("/admin", function(req, res) {
  checkIfAdmin(req, res, function(){
    findAndRender(res, "admin");
  });
});


// ---------- Add Category Route ----------
app.route("/add")

  .get(function(req, res) {
    checkIfAdmin(req, res, function(){
      res.render("add");
    });
  })

  .post(function(req, res) {
    checkIfAdmin(req, res, function(){
      const videosToAdd = [];
      if (req.body.video1Title && req.body.video1URL){
        const video1 = new Video({
          title: req.body.video1Title,
          url: req.body.video1URL
        });
        videosToAdd.push(video1);
      }
      if (req.body.video2Title && req.body.video2URL){
        const video2 = new Video({
          title: req.body.video2Title,
          url: req.body.video2URL
        });
        videosToAdd.push(video2);
      }
      if (req.body.video3Title && req.body.video3URL){
        const video3 = new Video({
          title: req.body.video3Title,
          url: req.body.video3URL
        });
        videosToAdd.push(video3);
      }
      const category = new Category({
        name: req.body.name,
        description: req.body.description,
        previewURL: req.body.previewURL,
        orderNumber: req.body.orderNumber,
        videos: videosToAdd
      });
      category.save();
      res.redirect("/admin");
    });
  });


// ---------- Add Video Route ----------
app.route("/add-video/:categoryId")

  .get(function(req, res) {
    checkIfAdmin(req, res, function(){
      res.render("add-video", {categoryId: req.params.categoryId});
    });
  })

  .post(function(req, res) {
    checkIfAdmin(req, res, function(){
      const categoryId = req.params.categoryId;
      const videosToAdd = [];
      if (req.body.video1Title && req.body.video1URL){
        const video1 = new Video({
          title: req.body.video1Title,
          url: req.body.video1URL
        });
        videosToAdd.push(video1);
      }
      if (req.body.video2Title && req.body.video2URL){
        const video2 = new Video({
          title: req.body.video2Title,
          url: req.body.video2URL
        });
        videosToAdd.push(video2);
      }
      if (req.body.video3Title && req.body.video3URL){
        const video3 = new Video({
          title: req.body.video3Title,
          url: req.body.video3URL
        });
        videosToAdd.push(video3);
      }
      for (video of videosToAdd) {
        Category.updateOne(
          { _id: categoryId },
          { $push: { videos: video } },
          function(err) {
            handleError(res, err);
          }
        );
      }
      res.redirect("/admin");
    });
  });


// ---------- Edit Category Route ----------
app.route("/edit/:categoryId")

  .get(function(req, res) {
    checkIfAdmin(req, res, function(){
      Category.findById(req.params.categoryId, function(err, foundCategory) {
        handleError(res, err);
        res.render("edit", {category: foundCategory});
      });
    });
  })

  .post(function(req, res) {
    checkIfAdmin(req, res, function(){
      Category.updateOne(
        { _id: req.params.categoryId },
        { name: req.body.name,
          description: req.body.description,
          previewURL: req.body.previewURL,
          orderNumber: req.body.orderNumber
        },
        function(err) {
          handleError(res, err);
          res.redirect("/admin");
        }
      );
    });
  });


// ---------- Delete Category Route ----------
app.route("/delete/:categoryId")

  .get(function(req, res) {
    checkIfAdmin(req, res, function(){
      Category.findById(req.params.categoryId, function(err, foundCategory) {
        handleError(res, err);
        res.render("delete", {category: foundCategory});
      });
    });
  })

  .post(function(req, res) {
    checkIfAdmin(req, res, function(){
      Category.deleteOne({_id: req.params.categoryId}, function(err) {
        handleError(res, err);
        res.redirect("/admin");
      });
    });
  });


// ---------- Delete Video Route ----------
app.route("/delete-video/:categoryId/:videoId")

  .get(function(req, res) {
    checkIfAdmin(req, res, function(){
      Category.findById(req.params.categoryId, function(err, foundCategory) {
        handleError(res, err);
        res.render("delete-video", {category: foundCategory, videoId: req.params.videoId});
      });
    });
  })

  .post(function(req, res) {
    checkIfAdmin(req, res, function(){
      Category.updateOne(
        {_id: req.params.categoryId},
        {$pull: { videos: { _id : req.params.videoId } } },
        function(err){
          handleError(res, err);
          res.redirect("/admin");
        }
      );
    });
  });


// ---------- Edit Web Route ----------
app.route("/edit-web")

  .get(function(req, res) {
    Data.findById(process.env.DATA_ID, function(err, foundData) {
      res.render("edit-web", {data: foundData});
    });
  })

  .post(function(req, res) {
    checkIfAdmin(req, res, function(){
      Data.updateOne(
        {_id: process.env.DATA_ID},
        req.body,
        function(err){
          handleError(res, err);
        }
      );
      res.redirect("/admin");
    });
  });


// ---------- Register/Login/Logout Routes ----------
app.route("/register")

  .get(function(req, res) {
    res.render("register");
  })

  .post(function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        res.redirect("/login");
      }
    });
  });


app.route("/login")

  .get(function(req, res) {
    res.render("login");
  })

  .post(function(req, res) {
    const userToBeChecked = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(userToBeChecked, function(err) {
      if (err) {
        console.log(err);
        res.redirect("/login");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/admin");
        });
      }
    });
  });


app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });


// ***************************** Start App *****************************
app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000.");
});
