const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const AdminSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false // Default is a regular Admin, set to true for Admins
    }
});

AdminSchema.index({ username: 1 }, { unique: true });


module.exports = mongoose.model('Admin', AdminSchema);
