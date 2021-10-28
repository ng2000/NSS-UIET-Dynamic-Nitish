const mongoose = require('mongoose');

var memberSchema =new mongoose.Schema({
    name:String,
    position: String,
	imagename: String,
    fb: String,
    twiter: String,
    linkedin: String,
});

var memberModel = mongoose.model('memberupload', memberSchema);
module.exports=memberModel;