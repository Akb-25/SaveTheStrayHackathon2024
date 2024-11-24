const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
    timestamp:{
        type: Date,
        default: Date.now,
    },
    location: {
        type: {
          latitude: Number,
          longitude: Number,
        },
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1, 
      },
      bbox: {
        type: [Number], 
        required: true,
      },
      image: {
        type: String,
        required: true,
      }
});

module.exports = mongoose.model("Detection", detectionSchema)