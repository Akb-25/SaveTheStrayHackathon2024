const classToAnimal = {
    9: "Antelope",
    33: "Bear",
    96: "Cat",
    99: "Cattle",
    106: "Cheetah",
    108: "Chicken",
    160: "Dog",
    174: "Duck",
    179: "Elephant",
    206: "Fox",
    215: "Giraffe",
    219: "Goat",
    225: "Goose",
    251: "Hippopotamus",
    255: "Horse",
    282: "Jaguar",
    297: "Koala",
    313: "Lion",
    319: "Lynx",
    340: "Monkey",
    359: "Otter",
    366: "Panda",
    379: "Penguin",
    387: "Pig",
    398: "Polar Bear",
    411: "Rabbit",
    412: "Raccoon",
    421: "Reptile",
    422: "Rhinocoreous",
    452: "Sheep",
    470: "Snake",
    488: "Squirrel",
  };

  let map;
  let markers = [];
  let detections = [];
  let categories = new Set();
  let heatmap;
  let heatmapData = [];
  let showHeatmapOnly = false;

  async function initMap() {
    const response = await fetch('http://localhost:5000/api/detections');
    detections = await response.json();

    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 25.9716, lng: 71.5946 },
      zoom: 2,
    });

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
    });

    detections.forEach(detection => {
      const marker = new google.maps.Marker({
        position: { lat: detection.location.latitude, lng: detection.location.longitude },
        map: map,
        title: classToAnimal[detection.category],
        icon: {
          size: new google.maps.Size(1, 1),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(15, 15)
        },
      });

      markers.push({ marker, category: detection.category });

      heatmapData.push(new google.maps.LatLng(detection.location.latitude, detection.location.longitude));

      categories.add(detection.category);
    });

    populateCategoryFilter();
    displayCategoryAnalytics();
    displayCategoryImages();
  }

  function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    for (let classNumber in classToAnimal) {
      const option = document.createElement('option');
      option.value = classNumber;
      option.textContent = classToAnimal[classNumber];
      categoryFilter.appendChild(option);
    }
  }

  async function filterDetections() {
    const selectedCategory = document.getElementById('category-filter').value;

    heatmapData = [];
    markers.forEach(({ marker, category }) => {
      if (selectedCategory === "" || category == selectedCategory) {
        marker.setMap(map);
        heatmapData.push(new google.maps.LatLng(marker.getPosition().lat(), marker.getPosition().lng()));
      } else {
        marker.setMap(null);
      }
    });

    heatmap.setData(heatmapData);

    const filteredDetections = selectedCategory
      ? detections.filter(detection => detection.category == selectedCategory)
      : detections;

    displayCategoryAnalytics(selectedCategory);
    displayCategoryImages(filteredDetections);
  }

  function displayCategoryImages(filteredDetections) {
    const imagesContainer = document.getElementById('category-images');
    imagesContainer.innerHTML = '';

    filteredDetections.forEach(detection => {
      const imgElement = document.createElement('img');
      imgElement.src = `data:image/jpeg;base64,${detection.image}`;
      imagesContainer.appendChild(imgElement);
    });
  }

  function displayCategoryAnalytics(selectedCategory) {
    const filteredDetections = selectedCategory
      ? detections.filter(detection => detection.category == selectedCategory)
      : detections;

    const count = filteredDetections.length;
    const avgConfidence = filteredDetections.reduce((sum, detection) => sum + detection.confidence, 0) / count;

    const analyticsContainer = document.getElementById('category-analytics');
    analyticsContainer.innerHTML = `
      <p><strong>Total Detections:</strong> ${count}</p>
      <p><strong>Average Confidence:</strong> ${avgConfidence.toFixed(2)}</p>
    `;
  }

  function toggleHeatmap() {
  showHeatmapOnly = !showHeatmapOnly;

  // Toggle heatmap visibility
  heatmap.setMap(showHeatmapOnly ? map : null);

  // Toggle markers visibility based on heatmap visibility
  markers.forEach(({ marker }) => {
      marker.setMap(showHeatmapOnly ? null : map);
  });

  // Update the button text for better UX
  document.getElementById('toggle-heatmap').innerText = showHeatmapOnly
      ? "Show Markers Only"
      : "Show Heatmap Only";
}

  initMap();