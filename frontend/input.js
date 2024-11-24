async function processImage() {
    const imageInput = document.getElementById('imageInput');
    if (!imageInput.files[0]) {
      alert("Please select an image file.");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async function(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);

        const response = await fetch('http://localhost:5000/api/process-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        console.log("Processing Result:", result);
        alert("Image processed successfully.");
      }, function(error) {
        alert("Geolocation error: " + error.message);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }