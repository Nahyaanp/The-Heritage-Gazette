const express = require('express');
const router = express.Router();
const Post = require('../models/Post');


//Routes
router.get('' , (req, res) => {

    const locals = {
        title: "The Heritage Gazette",
        description: "Simple Blog Created with NodeJs, Express & Mongo DB."
    }
    res.render('index', {locals});
});





function insertPostData () {
    Post.insertMany([
        {
            title:"Building a Blog",
            description:"This is the body text"
        },
    ])
}

insertPostData();

router.get('/about' , (req, res) => {
    res.render('about');
});

module.exports = router;