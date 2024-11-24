from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from ultralytics import YOLO
import cv2
import numpy as np


model = YOLO("yolov8n-oiv7.pt")

app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(img)

    target_classes = [
    9, 33, 96, 99, 106, 108, 160, 174, 179, 206, 215, 219, 225,
    251, 255, 282, 297, 313, 319, 340, 359, 366, 379, 387, 398, 411,
    412, 421, 422, 452, 470, 488, 506
    ]

    detections = []
    for result in results:
        for box in result.boxes:
                category = int(box.cls)
                if category in target_classes:
                    x_min, y_min, x_max, y_max = map(int, box.xyxy[0])
                    confidence = float(box.conf.item())
                    detections.append({
                        "class_id": category,
                        "confidence": confidence,
                        "bbox": [x_min, y_min, x_max, y_max]
                    })

    return JSONResponse(content={"detections": detections})