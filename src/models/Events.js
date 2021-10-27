const mongoose = require('mongoose');

var eventUploadSchema =new mongoose.Schema({
    heading: String,
    description: String,
	imagename: String,

});

var eventUploadModel = mongoose.model('eventupload', eventUploadSchema);
module.exports=eventUploadModel;