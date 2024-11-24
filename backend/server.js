const express = require('express');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const connectDB = require('./config/db');
const player = require('play-sound')(opts = {});
const Detection = require('./models/Detection');
const { timeStamp } = require('console');

const app = express();
connectDB();

app.use(express.json({ limit: '50mb' })); // Increase limit if images are large
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post('/api/detections', async(req, res) => {
    try{
        const detection = new Detection(req.body);
        const savedDetection = await detection.save();
        res.json(savedDetection);
    } catch(err){
        res.status(500).json({message: err.message});
    }
})
const PORT = process.env.PORT || 5000

function playSound(){
    player.play('scare.mp3', function(err) {
        if (err){
            console.log(err);
        }
    })
}

async function runDetectionModel(buffer){
    try{
        const formData = new FormData();
        formData.append('file', buffer, 'image.jpg');

        const response = await axios.post("http://0.0.0.0:9000/predict", formData, {
            headers:{
                ...formData.getHeaders()
            }
        });

        console.log("Detections: ",response.data.detections)
        const detections = response.data.detections;
        
        if (detections.length > 0){
            playSound();
        }
        const currentTimestamp = new Date();
        const currentLocation = {latitude: 12.85932, longitude: 12.85932}
        for (const detect of detections){
            const detectionData = {
                timestamp: currentTimestamp,
                location: currentLocation,
                category: detect.class_id,
                confidence: detect.confidence,
                bbox: detect.bbox,
            };

        const savedDetection = new Detection(detectionData);
        await savedDetection.save();
        console.log("Saved detection", detectionData);
        }
        return {message:"Detections processed and saved successfully"}
    } catch(err){
        console.log("Error",err);
        throw err;
    }
}

app.post('/detect', async (req, res) => {
    try{
        const { image } = req.body;
        const buffer = Buffer.from(image, 'base64');

        const result = runDetectionModel(buffer);
        res.json(result);
    
    } catch (err){
        console.error(err);
        res.status(500).json({message:"Detection processing did not happen", err});
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
