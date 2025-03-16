const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const News = require('../models/News');
const Poetry = require('../models/Poetry');
const Admin = require('../models/admin');
const User = require('../models/User'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middleware/authMiddleware');
const AdminLayout = '../views/layouts/Admin';
const jwtSecret = process.env.JWT_SECRET;


// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}); 

router.get('/invite-Admin', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Invite Admin',
      description: 'Send an invitation to add a new Admin.'
    };

    res.render('Admin/invite-Admin', { locals, layout: AdminLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading invitation page');
  }
});



/**
 * GET /
 * Admin - Login Page
*/
router.get('/Admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    res.render('Admin/index', { locals, layout: AdminLayout });
  } catch (error) {
    console.log(error);
  }
});
 

/**
 * POST /
 * Admin - Check Login
 */
router.post('/Admin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Use a different variable name to avoid overwriting the imported Admin model
    const adminRecord = await Admin.findOne({ username });

    if (!adminRecord) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, adminRecord.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ AdminId: adminRecord._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const posts = await Post.find();
    const news = await News.find(); 
    const poetry = await Poetry.find();
    res.render('Admin/dashboard', {
      locals,
      posts,  
      news,   
      poetry, 
      layout: AdminLayout
    });

  } catch (error) {
    console.log(error);
  }

});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with extension
  }
});
const upload = multer({ storage: storage });






// Invite Admin Route
router.get('/invite-Admin', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Invite Admin',
      description: 'Send an invitation to add a new Admin.'
    };
    res.render('Admin/invite-Admin', { locals, layout: AdminLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error loading invitation page');
  }
});

// Send Admin Invitation
router.post('/invite-Admin', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const token = jwt.sign({ email }, jwtSecret, { expiresIn: '1h' });

    const inviteLink = `${req.protocol}://${req.get('host')}/register-Admin/${token}`;

    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, '../../views/newsletter/Admininvitation.ejs'),
      { inviteLink }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Invitation',
      html: emailTemplate
    });

    console.log('Invitation sent successfully');

    // Redirect to dashboard after sending the email
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error sending invitation' });
  }
});
  

// Register Admin with Invitation Link
router.get('/register-Admin/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, jwtSecret);
    
    res.render('Admin/register-admin', { email: decoded.email, layout: AdminLayout });
  } catch (error) {
    console.log(error);
    res.status(400).send('Invalid or expired token');
  }
});



router.post('/register-Admin', async (req, res) => {  // <-- Make this function async
  try {
    const { username, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin
    const admin = await Admin.create({ username, password: hashedPassword });

    res.status(201).json({ message: 'Admin Created', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});







/**
 * GET /
 * Admin - Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Post.find();
    res.render('Admin/add-post', {
      locals,
      layout: AdminLayout 
    });

  } catch (error) {
    console.log(error);
  }

});


/**
 * POST /add-post
 * Admin - Create New Post with Image and Send Email
 */
router.post('/add-post', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    
    // Store image filename if uploaded
    let imageFilename = null;

    if (req.file) {
      imageFilename = req.file.filename; // Save the filename
    }

    // Create new post
    const newPost = new Post({
      title,
      body,
      image: imageFilename ? `/img/${imageFilename}` : null, // Save the relative image path in the database
    });

    await newPost.save();

    // Fetch all user emails
    const users = await User.find({}, 'email');
    const emailList = users.map(user => user.email);

    if (emailList.length > 0) {
      // Render email template
      const emailTemplate = await ejs.renderFile(
        path.join(__dirname, '../../views/newsletter/postwhencreated.ejs'),
        { title, body, imageUrl: imageFilename ? `/img/${imageFilename}` : '' }
      );

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: emailList.join(','),
        subject: `New Blog Post: ${title}`,
        html: emailTemplate
      });

      console.log('New post email sent to all users');
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error creating post');
  }
});







/**
 * GET /
 * Admin - Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {

    const locals = {
      title: "Edit Post",
      description: "Free NodeJs Admin Management System",
    };

    const data = await Post.findOne({ _id: req.params.id });

    res.render('Admin/edit-post', {
      locals,
      data,
      layout: AdminLayout
    })

  } catch (error) {
    console.log(error);
  }
 
});


/**
 * PUT /edit-post/:id
 * Admin - Update Post with Image
 */
router.put('/edit-post/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
      const { title, body } = req.body;
      const post = await Post.findById(req.params.id);
      
      // If Admin uploads a new image, use it; otherwise, keep old one
      const image = req.file ? req.file.filename : post.image;

      await Post.findByIdAndUpdate(req.params.id, {
          title,
          body,
          image,
          updatedAt: Date.now()
      });

      res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
      console.log(error);
      res.status(500).send("Error updating post");
  }
});


// router.post('/Admin', async (req, res) => {
//   try {
//     const { username, password } = req.body;
    
//     if(req.body.username === 'Admin' && req.body.password === 'password') {
//       res.send('You are logged in.')
//     } else {
//       res.send('Wrong username or password');
//     }

//   } catch (error) {
//     console.log(error);
//   }
// });


/**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin
    const admin = await Admin.create({ username, password: hashedPassword });

    res.status(201).json({ message: 'Admin Created', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});



/*



*/

/* TO VIEW News List*/
router.get('/news', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "News",
      description: "Manage news articles."
    };

    const newsData = await News.find();
    res.render('Admin/news', { locals, newsData, layout: AdminLayout });
  } catch (error) {
    console.log(error);
  }
});



/* TO add News List*/


router.get('/add-news', authMiddleware, async (req, res) => {
  res.render('Admin/add-news', { title: 'Add News', layout: AdminLayout });
});

router.post('/add-news', authMiddleware, async (req, res) => {
  try {
    const newNews = new News({
      title: req.body.title,
      body: req.body.body
    });

    await News.create(newNews);
    res.redirect('/news');
  } catch (error) {
    console.log(error);
  }
});

/* TO edit News List*/

router.get('/edit-news/:id', authMiddleware, async (req, res) => {
  const newsItem = await News.findById(req.params.id);
  res.render('Admin/edit-news', { title: 'Edit News', newsItem, layout: AdminLayout });
});

router.put('/edit-news/:id', authMiddleware, async (req, res) => {
  await News.findByIdAndUpdate(req.params.id, {
    title: req.body.title,
    body: req.body.body,
    updatedAt: Date.now()
  });
  res.redirect('/news');
});

/* TO delete News List*/

router.delete('/delete-news/:id', authMiddleware, async (req, res) => {
  await News.deleteOne({ _id: req.params.id });
  res.redirect('/news');
});




/* TO VIEW Poetry List*/
router.get('/poetry', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Poetry",
      description: "Manage poetry entries."
    };

    const poetryData = await Poetry.find();
    res.render('Admin/poetry', { locals, poetryData, layout: AdminLayout });
  } catch (error) {
    console.log(error);
  }
});




/* TO add Poetry List*/


router.get('/add-poetry', authMiddleware, async (req, res) => {
  res.render('Admin/add-poetry', { title: 'Add Poetry', layout: AdminLayout });
});

router.post('/add-poetry', authMiddleware, async (req, res) => {
  try {
    const newPoetry = new Poetry({
      title: req.body.title,
      body: req.body.body
    });

    await Poetry.create(newPoetry);
    res.redirect('/poetry');
  } catch (error) {
    console.log(error);
  }
});


/* TO edit Poetry List*/

router.get('/edit-poetry/:id', authMiddleware, async (req, res) => {
  const poetryItem = await Poetry.findById(req.params.id);
  res.render('Admin/edit-poetry', { title: 'Edit Poetry', poetryItem, layout: AdminLayout });
});

router.put('/edit-poetry/:id', authMiddleware, async (req, res) => {
  await Poetry.findByIdAndUpdate(req.params.id, {
    title: req.body.title,
    body: req.body.body,
    updatedAt: Date.now()
  });
  res.redirect('/poetry');
});

/* TO delete Poetry List*/

router.delete('/delete-poetry/:id', authMiddleware, async (req, res) => {
  await Poetry.deleteOne({ _id: req.params.id });
  res.redirect('/poetry');
});



/**
 * GET /
 * Admin Logout
*/
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  //res.json({ message: 'Logout successful.'});
  res.redirect('/');
});



module.exports = router;