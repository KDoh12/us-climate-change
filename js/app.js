(function () {
  // Adjust Height of map
  adjustHeight();
  window.addEventListener("resize", adjustHeight());

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

  // Array of the months
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Array of years
  // const years = ["1900", "1910", "1920", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];
  // Set the year to initially compare
  let year = "1910";

  // AJAX request for GeoJSON data
  fetch("data/us_counties_2020_20m.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (counties) {
      Papa.parse("data/AvgTempCounties.csv", {
        download: true,
        header: true,
        complete: function (data) {
          processData(counties, data, "1910");
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
  function processData(counties, data, year) {
    let years = ["1900", year];

    // Loop through all counties and add data
    for (let i of counties.features) {
      for (let y of years) {
        for (let j of data.data) {
          if (i.properties.GEOID === j.GEOID) {
            if (j.Year === y) {
              i.properties[y] = j;
              break;
            }
          }
        }
      }
      // for (let j of data.data) {
      //   if (i.properties.GEOID === j.GEOID) {
      //     if (j.Year === "1900") {
      //       i.properties["1900"] = j;
      //       break;
      //     }
      //   }
      // }
    }

    console.log(counties);

    // Empty array to hold data values
    const rates = [];
    // Empty object to hold difference values
    var valueDiff = {
      Year: years[1],
    };
    // Loop through counties and populate array
    counties.features.forEach(function (county) {
      const compProps = county.properties[years[1]];
      const subProps = county.properties["1900"];
      if (compProps && subProps) {
        for (const prop in compProps) {
          if (months.includes(prop) && Number(compProps[prop]) < 99.9) {
            var diff = Number(Number(Number(compProps[prop]) - Number(subProps[prop])).toFixed(1));
            rates.push(diff);
            valueDiff[prop] = diff;
          }
        }
      }
      // const props = county.properties["1900"];
      // if (props) {
      //   for (const prop in props) {
      //     if (months.includes(prop) && Number(props[prop]) < 99.9) {
      //       rates.push(Number(props[prop]));
      //     }
      //   }
      // }
    });
    console.log(rates);
    console.log(valueDiff);

    // Create breaks
    var breaks = chroma.limits(rates, "q", 5);
    // Create color generator
    var colorize = chroma.scale(chroma.brewer.Oranges).classes(breaks).mode("lab");

    drawMap(counties, colorize, valueDiff);
    drawLegend(breaks, colorize);
  }

  // Function to draw data on the map
  function drawMap(counties, colorize, valueDiff) {
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

    updateMap(dataLayer, colorize, "Jan", valueDiff);
    addUI(dataLayer, colorize, "Jan", valueDiff);
  }
  // ****** End drawMap ******

  // Function to update the map
  function updateMap(dataLayer, colorize, currentMonth, valueDiff) {
    dataLayer.eachLayer(function (layer) {
      const props = layer.feature.properties[valueDiff.Year];
      var tooltipInfo = "";
      if (props) {
        // Style the layer
        layer.setStyle({
          fillColor: colorize(valueDiff[currentMonth]),
        });
        // Create popup
        tooltipInfo = `${valueDiff[currentMonth]}`;
      } else {
        tooltipInfo = `No Data`;
      }

      layer.bindTooltip(tooltipInfo);
    });
  }
  // ****** End updateMap ******

  // Function to draw the legend
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
    const legend = document.querySelector(".legend");
    legend.innerHTML = `<h3>Jan Average Temp (F)</h3><ul>`;
    legend.innerHTML += `<li><span style="background:#363636"></span> No Data Available</li>`;

    // Loop break values and add to legend
    for (let i = 0; i < breaks.length - 1; i++) {
      const color = colorize(breaks[i], breaks);
      const classRange = `<li><span style="background:${color}"></span> ${breaks[i]} &mdash; ${breaks[i + 1]}</li>`;
      legend.innerHTML += classRange;
    }
    legend.innerHTML += `</ul>`;
  }
  // ****** End drawLegend ******

  // Function to add the UI Slider
  function addUI(dataLayer, colorize, month, valueDiff) {
    // Add Slider
    const sliderControl = L.control({
      position: "bottomleft",
    });
    sliderControl.onAdd = function () {
      const controls = L.DomUtil.get("slider");
      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);
      return controls;
    };
    sliderControl.addTo(map);

    // Get slider value
    let currentMonth = month;
    slider = document.querySelector(".form-range");
    slider.addEventListener("input", function (e) {
      // console.log(months[e.target.value]);
      currentMonth = months[e.target.value];

      // Update map with current month
      updateMap(dataLayer, colorize, currentMonth, valueDiff);

      // Update legend with current month
      document.querySelector(".legend h3").innerHTML = `${currentMonth} Average Temp (F)`;
    });

    // Get dropdown value
    let dropdown = document.querySelector("#dropdown-ui");
    dropdown.addEventListener("change", function (e) {
      year = e.target.value;
      console.log(year);
    });
  }
  // ****** End addUI ******

  // Function to get the selected year
  function getYear() {}

  /* When the user clicks on the button,
  toggle between hiding and showing the dropdown content */
  function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
  }

  function dropFilter() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("myDropdown");
    a = div.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = "";
      } else {
        a[i].style.display = "none";
      }
    }
  }
  // ****** End dropFilter ******
})();
