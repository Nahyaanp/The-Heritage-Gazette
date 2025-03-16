const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PoetrySchema = new Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String, 
        required: true
    },
    createdAt: {
        type: Date, 
        default: Date.now
    },
    updatedAt: {
        type: Date, 
        default: Date.now
    }
});

module.exports = mongoose.model('Poetry', PoetrySchema);
