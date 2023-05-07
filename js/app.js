(function () {
  // Adjust Height of map
  adjustHeight();
  window.addEventListener("resize", adjustHeight);

  // Add Map
  const map = L.map("map", {
    center: [38.5, -95.5],
    zoom: 5,
    zoomControl: false,
    attributionControl: false,
  });

  // Add Basemap
  const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  });
  tileLayer.addTo(map);

  // AJAX request for GeoJSON data
  fetch("data/us_counties_2020_20m.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (counties) {
      // Load csv data via PapaParse
      Papa.parse("data/AvgTempCounties_Annual.csv", {
        download: true,
        header: true,
        complete: function (data) {
          // When data is loaded, call processData function
          processData(counties, data);
        },
      });
      // Load the states boundaries
      return fetch("data/us_states_20m.geojson")
        .then(function (response) {
          return response.json();
        })
        .then(function (states) {
          addStates(states);
        });
    })
    .catch(function (error) {
      console.log(error);
    });

  // Function to resize map
  function adjustHeight() {
    const mapSize = document.querySelector("#map"),
      removeHeight = document.querySelector("#header").offsetHeight,
      resize = window.innerHeight - removeHeight;
    mapSize.style.height = `${resize}px`;
  }
  // ****** End adjustHeight ******

  // Function to process the data
  function processData(counties, data) {
    // Loop through all counties and add data
    for (let i of counties.features) {
      for (let j of data.data) {
        if (i.properties.GEOID === j.GEOID) {
          i.properties.Temp = j;
        }
      }
    }

    // Call the drawMap function
    drawMap(counties);
  }
  // ****** End processData ******

  // // Function to draw data on the map
  function drawMap(counties) {
    const dataLayer = L.geoJson(counties, {
      style: function (feature) {
        return {
          color: "#202020",
          weight: 1,
          fillOpacity: 1,
          fillColor: "#363636",
        };
      },
    }).addTo(map);

    // If the window is smaller than a desktop
    if (window.screen.width < 1400) {
      // Create lat and lng to fit map to screen
      bounds = [
        [53.83, -66.27],
        [20.34, -125.51],
      ];
      // Fit the map to defined lat and lng so that the U.S. will appear at any device screen
      map.fitBounds(bounds);
    }

    updateMap(dataLayer, "2020", "1900");
    addUI(dataLayer, "2020", "1900");
  }
  // ****** End drawMap ******

  // Function to update the map
  function updateMap(dataLayer, startYear, minYear) {
    // Empty array to hold data values
    const rates = [];

    // Loop through counties
    dataLayer.eachLayer(function (layer) {
      // Declare an empty variable to use in if/else statement
      let difference;
      // Create shorthand
      const props = layer.feature.properties.Temp;
      // If "props" exists
      if (props) {
        // If there is a "startYear" and a "minYear", and they don't equal 99.9 (the no data value)
        if (props[startYear] && props[minYear] && props[startYear] != "99.9" && props[minYear] != "99.9") {
          // Subtract minYear from startYear and round to 1 decimal
          difference = Number(Number(props[startYear] - props[minYear]).toFixed(1));
          // Push into the rates array
          rates.push(difference);
        } else {
          // If they don't exist or they equal 99.9
          difference = 99.9;
        }
      } else {
        // If "props" doesn't exist
        difference = 99.9;
      }
      // Add the difference value to the geojson
      layer.feature.properties.Difference = difference;
    });

    // Create breaks
    var breaks = getClassBreaks(rates);

    // Loop through counties to build popup and assign color
    dataLayer.eachLayer(function (layer) {
      // Create shorthand
      const props = layer.feature.properties;
      // Start popup template
      let popupInfo = `<b>${props.NAME} County</b><br>`;
      // Assign color and popup info if the value exists and isn't 99.9
      if (props.Difference && props.Difference < 99.9) {
        layer.setStyle({
          fillColor: getColor(props.Difference, breaks), // colorize(props.Difference),
        });

        popupInfo += `${minYear}: ${props.Temp[minYear]} &deg;F<br>
                        ${startYear}: ${props.Temp[startYear]} &deg;F<br>
                        Difference: ${props.Difference} &deg;F`;
      } else {
        // Build popup if value doesn't exist or is 99.9
        popupInfo += `No Data Available`;
      }

      // Attach popup
      layer.bindPopup(popupInfo);

      // Change style when mouse moves over county
      layer.on("mouseover", function () {
        layer
          .setStyle({
            color: "#51dbdd",
            fillOpacity: 0.8,
            weight: 2,
          })
          .bringToFront();
      });

      // Change style back when mouse moves away from county
      layer.on("mouseout", function () {
        layer
          .setStyle({
            color: "#4D4D4D",
            fillOpacity: 1,
            weight: 1,
          })
          .bringToBack();
      });

      // Change the style when the popup opens
      // This is mainly for mobile users so they have visual affordance
      layer.on("popupopen", function () {
        layer
          .setStyle({
            color: "#F0DF30",
            weight: 2,
          })
          .bringToFront();
      });

      // Change style back when popup closes
      // This is mainly for mobile users so they have visual affordance
      layer.on("popupclose", function () {
        layer
          .setStyle({
            color: "#4D4D4D",
            weight: 1,
          })
          .bringToBack();
      });
    });

    // Call the drawLegend function
    drawLegend(breaks);
  }
  // ****** End updateMap ******

  // // Function to draw the legend
  function drawLegend(breaks) {
    // Add Legend
    const legendControl = L.control({
      position: "bottomright",
    });
    // When legend gets added...
    legendControl.onAdd = function () {
      const legend = L.DomUtil.get("legend");
      // Disable scroll and click events
      L.DomEvent.disableScrollPropagation(legend);
      L.DomEvent.disableClickPropagation(legend);
      return legend;
    };
    // Add legend to the map
    legendControl.addTo(map);

    // Build initial legend
    const legend = document.querySelector("#legend");
    legend.innerHTML = `<h3>Temp (&deg;F) Difference</h3><ul>`;
    legend.innerHTML += `<li><span style="background:#363636"></span> No Data</li>`;

    // Loop break values and add to legend
    for (let i = 0; i < breaks.length; i++) {
      const color = getColor(breaks[i][0], breaks);
      const classRange = `<li><span style="background:${color}"></span> ${breaks[i][0]}&deg; &mdash; ${breaks[i][1]}&deg;</li>`;
      legend.innerHTML += classRange;
    }
    legend.innerHTML += `</ul>`;
  }
  // // ****** End drawLegend ******

  // Function to add the UI
  function addUI(dataLayer, startYear, minYear) {
    // Get dropdown value
    let minDropdown = document.querySelector("#minYear");
    // Add event listener to dropdown for when selection changes
    minDropdown.addEventListener("change", function (e) {
      minYear = e.target.value;
      // console.log(minYear);
      calculateCompare();
    });

    // Get dropdown value
    let startDropdown = document.querySelector("#startYear");
    // Add event listener to dropdown for when selection changes
    startDropdown.addEventListener("change", function (e) {
      startYear = e.target.value;
      // console.log(startYear);
      calculateCompare();
    });

    function calculateCompare() {
      // if/else statements to prevent user from miscalculating
      if (Number(startYear - minYear) < 0) {
        return alert("Please choose a starting decade lower than the ending decade.");
      } else if (Number(startYear - minYear === 0)) {
        return alert("The starting and ending decade are the same. Please choose a starting decade lower than the ending decade.");
      } else {
        // If everything is fine, call the updateMap function
        updateMap(dataLayer, startYear, minYear);
      }
    }
  }
  // ****** End addUI ******

  // Function to get class breaks
  function getClassBreaks(rates) {
    // Create clusters using simple statistics
    const clusters = ss.ckmeans(rates, 5);

    // Create the breaks based on the clusters
    const breaks = clusters.map(function (cluster) {
      return [cluster[0], cluster.pop()];
    });

    return breaks;
  }
  // ****** End getClassBreaks ******

  // Function to get color
  function getColor(value, breaks) {
    if (value <= breaks[0][1]) {
      return "#0571b0";
    } else if (value <= breaks[1][1]) {
      return "#92c5de";
    } else if (value <= breaks[2][1]) {
      return "#f7f7f7";
    } else if (value <= breaks[3][1]) {
      return "#f4a582";
    } else if (value <= breaks[4][1]) {
      return "#ca0020";
    }
  }
  // ****** End getColor ******

  // Function to add states
  function addStates(states) {
    const statesLayer = L.geoJson(states, {
      style: function (feature) {
        return {
          fill: false,
          color: "#999999",
          weight: 2,
          opacity: 0.5,
          dashArray: "[5, 0, 5]",
        };
      },
    }).bringToFront();

    // Add states to the map
    statesLayer.addTo(map);
  }
})();
