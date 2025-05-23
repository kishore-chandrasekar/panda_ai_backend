const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const tagSchema = new Schema({
    photoId: {
        type: Types.ObjectId,
        required: true,
        ref: 'Photo'
    },
    value: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);
