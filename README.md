# Is the U.S. Heating Up?

Welcome to my climate change project!

Please feel free to read about the project below!

Head on over to the [map](https://kdoh12.github.io/us-climate-change/)!

## Overview

This project was created as the final project for MAP 673 in the [New Maps Plus](https://newmapsplus.github.io/) program at the [University of Kentucky](https://www.uky.edu/).

Briefly, this project displays the difference in average annual temperatures per county in the time range of 1900 - 2020. This information is displayed on a choropleth map with a divergent color scheme in an effort to highlight counties where average temperatures either lowered or increased dramatically.

## Usage

Users can change the time periods that are evaluated using the 2 dropdown buttons on the map. Once the user hits "Compare", the map will update with the new temperature differences.

## Why

Climate change is a continously increasing threat to humanity. By studying it's effects, and how it is effected, hopefully it can be slowed down and the impacts it has on us be minimized. My goal for this project is to create a usefull tool that can be used to visualize patterns of rising and decreasing temperature changes over long periods of time. I plan on updating this project to add more functionality and data.

## How

I downloaded the climate data from [NOAA](https://www.ncei.noaa.gov/pub/data/cirs/climdiv/). In the linked directory there are tons of othe data files, but the one I focused on was the one that houses average temperatures per county, per month since 1895 (not all counties go that far back).

Once the data was downloaded, I had to manipulate it slightly into a CSV file. I soon found that while it includes the County FIPS codes, the state codes do not match State FIPS codes, so I had to alter those. Then I simply added all the months together and got an average yearly temperature.

In the javascript I am bringing that csv file into the DOM and joining it to a geojson file of county boundaries which is then getting symbolized as a choropleth map. For the class breaks I am using [ckmeans](https://simple-statistics.github.io/docs/#ckmeans) from the Simple Statistics library.

## Challenges

One of the biggest challenges I faced during this project was the sheer size of the data itself. My original goal was to allow the user to choose the decades to compare, and then allow them to cycle through the months as well as the year. In order to do this, all combinations of decade comparisons had to be calculated... this meant finding millions of values. I started developing a separate html file that housed just JavaScript who entire purpose was to calculate those values and output them as some sort of json that can be used in the actual map.

With some help and magic from Boyd, our professor. I ended up with a calc.html file that seemed to find the values. I was unable to go through and verify that data in the amount of time I had left so I opted to scale back my project slightly to only showcase the annual average temperatures... for now.

## The Future

I have a lot of ideas for this project that I wasn't able to implement during MAP 673; and as stated in the challenges section, I had to scale back slightly from what I originally wanted.

Because of this, I plan on continuing this project and create what I set out to create. I also want to hopefully turn this project into my thesis project for my Masters' Degree.
