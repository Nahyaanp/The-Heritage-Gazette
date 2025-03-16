const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const News = require('../models/News');
const Poetry = require('../models/Poetry');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const ejs = require('ejs');
const path = require('path');

const app = express();

 

// Register User
app.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const sessionToken = "token_" + Math.random().toString(36).substr(2, 16);

    const user = new User({ fullName, email, password: hashedPassword, sessionToken });
    await user.save();


    // Generate a session token (you can use JWT or just a random token)
    user.sessionToken = `${user._id}_${new Date().getTime()}`;
    await user.save();

    // Send a confirmation email using nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Render the email template using EJS
    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, '../../views/newsletter/UserRegister.ejs') // Make sure the path is correct
    );

    // Send the email to the user
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to BVHS Blog',
      html: emailTemplate
    });

    res.json({ message: 'Registration successful! A confirmation email has been sent.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during registration.' });
  }
});



 




/**
 * GET /
 * HOME
 */
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "Home Page",
      description: "Blogging Page For BVHS"
    }

    let perPage = 10;
    let page = req.query.page || 1;

    // Fetch posts, news, and poetry
    const posts = await Post.aggregate([ { $sort: { createdAt: -1 } } ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const news = await News.aggregate([ { $sort: { createdAt: -1 } } ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const poetry = await Poetry.aggregate([ { $sort: { createdAt: -1 } } ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    // Count documents for pagination
    const count = await Post.countDocuments({});
    const countNews = await News.countDocuments({});
    const countPoetry = await Poetry.countDocuments({});

    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', { 
      locals,
      posts,
      news,
      poetry,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/',
      hasNextPagePost: nextPage <= Math.ceil(count / perPage),
      hasNextPageNews: nextPage <= Math.ceil(countNews / perPage),
      hasNextPagePoetry: nextPage <= Math.ceil(countPoetry / perPage)
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading the homepage.');
  }
});

/**  
 * GET /post/:id
 * Post :id
 */
router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    // Find the post using only the slug (which is the ObjectId)
    const data = await Post.findById(slug);

    // Ensure data exists, otherwise handle it (optional)
    if (!data) {
      return res.status(404).send('Post not found');
    }

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    }

    res.render('post', { 
      locals,
      data,
      currentRoute: `/post/${slug}`
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Something went wrong.');
  }
});

/**
 * GET /news/:id
 * News :id
 */
router.get('/news/:id', async (req, res) => {
  try {
    let slug = req.params.id;
    const data = await News.findById({ _id: slug });

    if (!data) {
      return res.status(404).send('News not found');
    }

    const locals = {
      title: data.title,
      description: "News article from the Heritage Gazette."
    };

    res.render('news', { 
      locals,
      data,
      currentRoute: `/news/${slug}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading news article.');
  }
});

/**
 * GET /poetry/:id
 * Poetry :id
 */
router.get('/poetry/:id', async (req, res) => {
  try {
    let slug = req.params.id;
    const data = await Poetry.findById({ _id: slug });

    if (!data) {
      return res.status(404).send('Poetry not found');
    }

    const locals = {
      title: data.title,
      description: "Poetry piece from the Heritage Gazette."
    };

    res.render('poetry', { 
      locals,
      data,
      currentRoute: `/poetry/${slug}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading poetry piece.');
  }
});


/**
 * POST /search
 * Post - searchTerm
 */
/**
 * POST /search
 * Search Posts, News, and Poetry
 */
router.post('/search', async (req, res) => {
  try {
    const locals = {
      title: "Search Results",
      description: "Search results for your query."
    }

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    // Search in Posts
    const posts = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    // Search in News
    const news = await News.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    // Search in Poetry
    const poetry = await Poetry.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    res.render("search", {
      posts,
      news,
      poetry,
      locals,
      currentRoute: '/search'
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Error performing search.');
  }
});


/**
 * GET /about
 * About page
 */
router.get('/about', (req, res) => {
  res.render('about', {
    currentRoute: '/about'
  });
});

module.exports = router;
