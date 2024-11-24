const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const connectDB = require('./config/db');
const player = require('play-sound')(opts = {});
const Detection = require('./models/Detection');
const cors = require('cors');

const app = express();
app.use(cors());
connectDB();

app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// app.post('/api/detections', async(req, res) => {
//     try{
//         const detection = new Detection(req.body);
//         const savedDetection = await detection.save();
//         res.json(savedDetection);
//     } catch(err){
//         res.status(500).json({message: err.message});
//     }
// })

app.get('/api/detections', async (req, res) => {
    try{
        const detections = await Detection.find();
        res.json(detections);
    } catch (err) {
        res.status(500).json({message:err.message})
    }
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

function playSound(){
    player.play('scare.mp3', function(err) {
        if (err){
            console.log(err);
        }
    })
}
async function sendImageForDetection(imagePath){
    try{
        const imageBuffer = fs.readFileSync(imagePath);
        const formData = new FormData();
        formData.append('file', imageBuffer, imagePath);

        const response = await axios.post("http://0.0.0.0:9000/predict", formData, {
            headers:{
                ...formData.getHeaders()
            }
        });
        const detections = response.data.detections;
        
        if (detections.length > 0){
            playSound();
        }
        const currentTimestamp = new Date();
        const currentLocation = {latitude: 20.5937, longitude: 78.9629}
        for (const detect of detections){
            const { class_id, confidence, bbox } = detect;
            
            const detectionData = {
                timestamp: currentTimestamp,
                location: currentLocation,
                category: class_id,
                confidence: confidence,
                bbox: bbox,
                image: imageBuffer.toString('base64'),
              };
        const savedDetection = new Detection(detectionData);
        await savedDetection.save();
        console.log("Saved detection");

        }
        return response.data.detections;
    } catch (e) {
        console.error("Error while sending detection request: ",e);
    }
}

// sendImageForDetection("elephants.jpeg")

app.post('/api/process-video', upload.single('video'), async (req, res) => {
    const videoPath = req.file.path;
    const frameDir = path.join(__dirname, 'frames');

    if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);  

    const detectedAnimals = new Set();

    ffmpeg(videoPath)
    .output(`${frameDir}/frame-%03d.jpg`)
    .outputOptions('-vf', 'fps=1')  
    .on('end', async () => {
        const frames = fs.readdirSync(frameDir);
        for (const frame of frames) {
            const framePath = path.join(frameDir, frame);
            const frameBuffer = fs.readFileSync(framePath);

            await runDetectionModelVideo(frameBuffer, detectedAnimals);
            
            fs.unlinkSync(framePath);  
        }
        res.json({ message: "Detected" });
    })
    .on("error", err => res.status(500).json({ message: err.message }))
    .run(); 
});

async function runDetectionModelVideo(buffer, detectedAnimals) {
    try {
      const formData = new FormData();
      formData.append('file', buffer, 'frame.jpg');
  
      const response = await axios.post("http://0.0.0.0:9000/predict", formData, {
        headers: { ...formData.getHeaders() },
      });
  
      const detections = response.data.detections;
      const currentTimestamp = new Date();
      const currentLocation = { latitude: 12.9716, longitude: 77.5946 }; 
  
      for (const detect of detections) {
        const { class_id, confidence, bbox } = detect;
  
        if (!detectedAnimals.has(class_id)) {
          detectedAnimals.add(class_id);  
  
          player.play('scare.mp3', err => { if (err) console.log(err) });
  
          const detectionData = {
            timestamp: currentTimestamp,
            location: currentLocation,
            category: class_id,
            confidence: confidence,
            bbox: bbox,
            image: buffer.toString('base64'),
          };
  
          const savedDetection = new Detection(detectionData);
          await savedDetection.save();
          console.log("Saved detection", detectionData);
        }
      }
    } catch (err) {
      console.log("Error in detection:", err);
    }
  }

app.post('/api/process-image', upload.single('image'), async (req, res) => {
    const imagePath = req.file.path;
    const { latitude, longitude } = req.body;

    try {
        const detectedAnimals = new Set();
        await runDetectionModel(imagePath, detectedAnimals, {latitude, longitude});

        fs.unlinkSync(imagePath);

        res.json({ message: "Image processed and detections saved." });
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ message: "Error processing image." });
    }
});

async function runDetectionModel(imagePath, detectedAnimals, currentLocation) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const formData = new FormData();
        formData.append('file', imageBuffer, path.basename(imagePath));

        const response = await axios.post("http://0.0.0.0:9000/predict", formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        const detections = response.data.detections;
        const currentTimestamp = new Date();
        

        for (const detect of detections) {
            const { class_id, confidence, bbox } = detect;

            if (!detectedAnimals.has(class_id)) {
                detectedAnimals.add(class_id); 

                player.play('scare.mp3', err => { if (err) console.log(err); });

                const detectionData = {
                    timestamp: currentTimestamp,
                    location: currentLocation,
                    category: class_id,
                    confidence: confidence,
                    bbox: bbox,
                    image: imageBuffer.toString('base64'),
                };

                const savedDetection = new Detection(detectionData);
                await savedDetection.save();
                console.log("Saved detection", detectionData);
            }
        }
    } catch (err) {
        console.error("Error in detection:", err);
        throw err; 
    }
}