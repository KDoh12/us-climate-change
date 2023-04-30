(function () {
  // Adjust Height of map
  adjustHeight();
  window.addEventListener("resize", adjustHeight);

  // Add event listener to toggle on/off the legend button
  const button = document.querySelector("#legend button");
  button.addEventListener("click", function () {
    const legend = document.querySelector(".legend");
    legend.classList.toggle("show-legend");
  });

  // Add Map
  const map = L.map("map", {
    center: [37.09024, -95.712891],
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
      Papa.parse("data/AvgTempCounties_Annual.csv", {
        download: true,
        header: true,
        complete: function (data) {
          processData(counties, data);
        },
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

    updateMap(dataLayer, "1910", "1900");
    addUI(dataLayer, "1910", "1900");
  }
  // ****** End drawMap ******

  // Function to update the map
  function updateMap(dataLayer, startYear, minYear) {
    // // Empty array to hold data values
    const rates = [];

    // Loop through counties
    dataLayer.eachLayer(function (layer) {
      let difference;
      const props = layer.feature.properties.Temp;
      if (props) {
        if (props[startYear] && props[minYear] && props[startYear] != "99.9" && props[minYear] != "99.9") {
          difference = Number(Number(props[startYear] - props[minYear]).toFixed(1));
          rates.push(difference);
        } else {
          difference = 99.9;
        }
      } else {
        difference = 99.9;
      }
      layer.feature.properties.Difference = difference;
    });

    console.log(dataLayer);
    // Create breaks
    var breaks = [-5, -2.5, -0.1, 0, 0.1, 2.5, 5];
    // var breaks = chroma.limits(rates, "k", 5);
    // Define the scale
    var scale = ["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"];
    // Create color generator
    var colorize = chroma.scale(scale).classes(breaks).mode("lab");

    dataLayer.eachLayer(function (layer) {
      const props = layer.feature.properties;
      let tooltipInfo = `${props.NAME} County<br>`;
      if (props.Difference && props.Difference < 99.9) {
        layer.setStyle({
          fillColor: colorize(props.Difference),
        });

        tooltipInfo += `${minYear}: ${props.Temp[minYear]} &#176F<br>
                        ${startYear}: ${props.Temp[startYear]} &#176F<br>
                        Difference: ${props.Difference} &#176F`;
      } else {
        tooltipInfo += `No Data Available`;
      }

      layer.bindTooltip(tooltipInfo);

      layer.on("mouseover", function () {
        layer
          .setStyle({
            color: "#51dbdd",
            fillOpacity: 0.8,
            weight: 2,
          })
          .bringToFront();
      });

      layer.on("mouseout", function () {
        layer.setStyle({
          color: "#202020",
          fillOpacity: 1,
          weight: 1,
        });
      });
    });

    drawLegend(breaks, colorize);
  }
  // ****** End updateMap ******

  // // Function to draw the legend
  function drawLegend(breaks, colorize) {
    // Add Legend
    const legendControl = L.control({
      position: "bottomright",
    });
    legendControl.onAdd = function () {
      const legend = L.DomUtil.get("legend");
      L.DomEvent.disableScrollPropagation(legend);
      L.DomEvent.disableClickPropagation(legend);
      return legend;
    };
    legendControl.addTo(map);

    // Build legend
    const legend = document.querySelector("#legend");
    legend.innerHTML = `<h3>Annual Temp (F) Difference</h3><ul>`;
    legend.innerHTML += `<li><span style="background:#363636"></span> No Data Available</li>`;

    // Loop break values and add to legend
    for (let i = 0; i < breaks.length - 1; i++) {
      const color = colorize(breaks[i], breaks);
      const classRange = `<li><span style="background:${color}"></span> ${breaks[i]} &mdash; ${breaks[i + 1]}</li>`;
      legend.innerHTML += classRange;
    }
    legend.innerHTML += `</ul>`;
  }
  // // ****** End drawLegend ******

  // Function to add the UI
  function addUI(dataLayer, startYear, minYear) {
    // Get dropdown value
    let minDropdown = document.querySelector("#minYear");
    minDropdown.addEventListener("change", function (e) {
      minYear = e.target.value;
      console.log(minYear);
    });

    // Get dropdown value
    let startDropdown = document.querySelector("#startYear");
    startDropdown.addEventListener("change", function (e) {
      startYear = e.target.value;
      console.log(startYear);
    });

    // Add Calculate button functionality
    const calcButton = document.querySelector("#calculate");
    calcButton.addEventListener("click", function (e) {
      if (Number(startYear - minYear) < 0) {
        return alert("Please choose a starting decade lower than the ending decade.");
      } else if (Number(startYear - minYear === 0)) {
        return alert("The starting and ending decade are the same. Please choose a starting decade lower than the ending decade.");
      } else {
        updateMap(dataLayer, startYear, minYear);
      }
    });
  }
  // ****** End addUI ******
})();
