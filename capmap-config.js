var alertOptions = {
    subDirectories: false,  //'meteorology,hydrology' etc.
    useLocation: false,
    defaultLanguage: 'en-US',
    dateFormat: 'long', // 'vs. ISOString'
    dateFormatString: 'MMMM Do YYYY, HH:mm:ss', // https://momentjs.com/docs/#/displaying/format/
    mapTileSource: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // https://leaflet-extras.github.io/leaflet-providers/preview/
    zoom: 7,
    center: [FILL_YOUR_LAT, FILL_YOUR_LON],
    bounds: {north: FILL_NORTH_BOUND, east: FILL_EAST_BOUND, south: FILL_SOUTH_BOUND, west: FILL_WEST_BOUND},
    attribution: 'Finnish Meteorological Institute',
    polygonOptions: {
        fillOpacity: 0.2,
        strokeOpacity: 1,
        strokeWeight: 3,
	  preventSymbolOverlapping: true,
    displayActiveFor: true,
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
    transparentIcons: false,
    customIcons: false,
    showUpdateTime: false,
    showIconLegend: false,
    customLocations: false,
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