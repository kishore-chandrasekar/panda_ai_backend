const mongoose = require("mongoose")
exports.connect = () => {
    try {
        mongoose.connect("mongodb+srv://pandoUser:kishorec@pandoai.sjcwmqi.mongodb.net/")
        console.log("connection Success")
    } catch (err) {
        console.log(err)
    }
}