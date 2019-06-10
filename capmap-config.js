var alertOptions = {
    useLocation: false,
    defaultLanguage: 'en-US',
    dateFormat: 'long', // 'vs. ISOString'
    dateFormatString: 'MMMM Do YYYY, HH:mm:ss', // https://momentjs.com/docs/#/displaying/format/
    accesToken: 'pk.eyJ1IjoibmFra2ltIiwiYSI6ImNqNWYzNzVvaDB3YmUyeHBuOWdwZnM0bHMifQ.QZCKhwf3ET5ujEeZ6_8X_Q',
    zoom: 7,
    center: [FILL_YOUR_LAT, FILL_YOUR_LON],
    bounds: {north: 27.0, east: -71.0, south: 20.0, west: -80.0},
    attribution: 'Finnish Meteorological Institute',
    polygonOptions: {
        fillOpacity: 0.2,
        strokeOpacity: 1,
        strokeWeight: 3,
				preventSymbolOverlapping: true
    },
    dayControl: true,
    day0Control: true,
    day1Control: true,
    day2Control: true,
    allDayControl: true,
    popUpMaxHeight: false, // maximum height in px
    refresh: 300, // Refresh interval seconds
    areaLimitForMarkers: 0.005,
    iconWidth: 30,
    iconHeight: 30,
    eventTypes: {
        // edit: "edit capmap-config.js",
        "tropical storm": "Tropical Storm",
        hurricane: "Hurricane",
        thunderstorm: "Severe Thunderstorm",
        tornado: "Severe Tornado",
        waterspout: "Severe Waterspout",
        flood: "Flood",
        visibility: "Visibility",
        wind: "Wind",
        rip: "Rip Current",
        tsunami: "Tsunami",
        swell: "Swell",
        earthquake: "Earthquake",
        temperature: "Temperature",
        "seasonal temperature": "Seasonal Temperature",
        drought: "Drought",
        fire: "Fire",
        craft: "Small Craft",
    }
};

// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'FILL-YOUR-ID', 'auto');
ga('send', 'pageview');
