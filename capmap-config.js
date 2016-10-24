var alertOptions = {
    defaultLanguage: 'en-US',
    zoom: 9,
    center: new google.maps.LatLng(FILL_YOUR_LAT, FILL_YOUR_LON),
    polygonOptions: {
	fillOpacity: 0.55,
	strokeWeight: 3,
    },
    dayControl: true,
    day0Control: true,
    day1Control: true,
    day2Control: true,
    allDayControl: true,
    refresh: 300, // Refresh interval seconds
    areaLimitForMarkers: 60000000,
};

// Google Analytics
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'FILL-YOUR-ID', 'auto');
ga('send', 'pageview');
