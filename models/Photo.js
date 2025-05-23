const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    photoName: String,
    description: String,
    metadata: String,
    uploadedAt: { type: Date, default: Date.now },
    AlbumName: String,
    deletedAt: Date,
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    filePath: String, 
});

module.exports = mongoose.model('Photo', photoSchema, 'photo_info');