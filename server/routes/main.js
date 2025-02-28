const express = require('express');
const router = express.Router();
const Post = require('../models/Post');


//Routes
router.get('' , async (req, res) => {

    const locals = {
        title: "The Heritage Gazette",
        description: "Simple Blog Created with NodeJs, Express & Mongo DB."
    }

    let perPage = 10;
    let page = req.query.page || 1 ; 


    const data = await Post.aggregate([{ $sort:{ createdAt : - 1 }}])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();

    const count = await Post.count();
    const nextPage = parseInt(page) + 1 ; 
    const hasNextPage = nextPage <= Math.ceil(count / perPage);



    try {
        const data = await Post.find();
        res.render('index', {
            locals ,
             data,
             current: page,
             nextPage : hasNextPage ? nextPage : null
             });
    } catch(error){
    console.log(error);
    }





    
});







router.get('/about' , (req, res) => {
    res.render('about');
});

module.exports = router;