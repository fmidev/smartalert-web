
var DEBUG = true;
var map;
var markers = [];
var polygons = [];
var mapMarkers = L.layerGroup();
var mapPolygons = L.layerGroup();
var languages = [];
var events = [];
var selectedDAY = null;
var selectedEVENT = null;
var translations = {};
var dayControll;

// Remember previous state
var selectedLANGUAGE  = localStorage.getItem("userLanguage")  ? localStorage.getItem("userLanguage")  : alertOptions.defaultLanguage;
//if (translations[selectedLANGUAGE] == null)
//{
//    selectedLANGUAGE = alertOptions.defaultLanguage;
//    localStorage.setItem("userLanguage",selectedLANGUAGE);
//}
//selectedLANGUAGE = "en-BS";
var selectedEVENT  = localStorage.getItem("userEventType")  ? localStorage.getItem("userEventType")  : "";

function debug(str)
{
    if (DEBUG)
	{
	    try {
		console.log(str);
	    } catch (e) {};
	}
}

function t(key)
{
    if (translations[selectedLANGUAGE][key] != null)
	return translations[selectedLANGUAGE][key];
    else
	return key;
}

// if (!google.maps.Polygon.prototype.getBounds) {
//     google.maps.Polygon.prototype.getBounds=function(){
// 	var bounds = new google.maps.LatLngBounds()
// 	this.getPath().forEach(function(element,index){bounds.extend(element)})
// 	return bounds
//     }
// }

Date.prototype.isBeforeDay = function(day) {
    var d = new Date();
    d.setDate(d.getDate() + day);
    d.setHours(23);
    d.setMinutes(59);
    d.setSeconds(59);
    d.setMilliseconds(999);
    
    debug(this + " < " + d);

    if (this.getTime() < d.getTime())
	return true;
    else
	return false;
}
    
Date.prototype.isAfterDay = function(day) {
    var d = new Date();
    d.setDate(d.getDate() + day);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(000);

    debug("After check: " + this + " > " + d);

    if (this.getTime() > d.getTime())
	return true;
    else
    return false;
}

Date.prototype.dateDiff = function() {
    var date = this;
    var now = new Date();
    var string = "";

    var diff = date - now;
    var abs =  Math.abs(date - now);
    var days = Math.floor(abs/86400000);
    var hours = Math.floor(abs%86400000/3600000);
    var minutes = Math.floor(abs%86400000%3600000/60000);
  
    if (days == 1)
	string = string + days + " " + t('day') + " ";
    else if (days > 1)
	string = string + days + " " + t('days') + " ";

    if (hours == 1)
	string = string + hours + " " + t('hour') + " ";
    else if (hours > 1)
	string = string + hours + " " + t('hours') + " ";

    if (minutes == 1)
	string = string + minutes + " " + t('minute') + " ";
    else if (minutes > 1 || minutes==0)
	string = string + minutes + " " + t('minutes') + " ";

    if (diff < 0)
	string = string + t("ago");

    return string;
}

function initialize () {

    // var mapOptions = {
	// zoom: alertOptions.zoom,
	// center: alertOptions.center,
	// mapTypeId: google.maps.MapTypeId.TERRAIN,
	// mapTypeControl: false,
	// streetViewControl: false,
	// scaleControl: true,
	// zoomControl: true,
	// zoomControlOptions: {
	//     position: google.maps.ControlPosition.RIGHT_CENTER
	// },
    // };

    map = L.map('map-canvas', {
        zoom: alertOptions.zoom,
        fullscreenControl: true,
        scrollWheelZoom: true,
        center: alertOptions.center,
        accessToken: alertOptions.accesToken
    });
  

    // user location disabled
    if (alertOptions.useLocation == true)
    centerUserLocation();
    
    // map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    // map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('legend'));
    // map.fitBounds(alertOptions.bounds);

    // mapbox access token
    // https://www.mapbox.com/account/

    var Esri_WorldTopoMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="http://meteo.kg">'+alertOptions.attribution+'</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
    }).addTo(map);

    var southWest = new L.LatLng( alertOptions.bounds.south,alertOptions.bounds.east );
    var northEast = new L.LatLng( alertOptions.bounds.north,alertOptions.bounds.west ); 
    var bounds = new L.LatLngBounds(southWest,northEast);
    map.fitBounds(bounds, { padding: [5, 5] }); 

    document.getElementById('eventType').addEventListener('change', function() {
	    debug('Event Type selected: ' + document.getElementById('eventType').value);
	    if  (document.getElementById('eventType').value != "")
		selectedEVENT = document.getElementById('eventType').value;
	    else
		selectedEVENT = null;
	    showMarkers(selectedDAY);
	    showPolygons(selectedDAY);
	});

    $("#lang").html('');
    $(Object.keys(translations)).each(function(i,lang) {
	    debug('Added language '+ lang + ' to language dropdown menu.');
	    $("#lang").append($("<option>").attr('value',lang).text(translations[lang][lang]));
	    if (lang === selectedLANGUAGE)
		$("#lang").val(lang).change();
	});

    $( "#lang").on('change', changeLanguage );

    if (Object.keys(translations).length < 2)
	$( "#lang").css('display','none');


    updateEventSelect();
    //    $( "#eventType").on('change', changeLanguage );
        
    setInterval(updateData, alertOptions.refresh*1000);
    changeLanguage();

}

function updateEventSelect () {
    $("#eventType").html('');
    $("#eventType").append($("<option>").attr('value',"").text(t("All Hazard Types")));
    $(Object.keys(alertOptions.eventTypes)).each(function(i,eventType) {
	    debug('Added eventType '+ eventType + ' to eventType dropdown menu.');
	    $("#eventType").append($("<option>").attr('value',eventType).text(t(alertOptions.eventTypes[eventType])));
	    if (eventType === selectedEVENT)
	    	$("#eventType").val(eventType).change();
	});
}

function changeLanguage () {
    debug('Language selected: ' + document.getElementById('lang').value);
    selectedLANGUAGE = document.getElementById('lang').value;
    localStorage.setItem("userLanguage",selectedLANGUAGE);

    // Translate Legend
    $( "#levelNoneText" ).text(t("no awareness needed"));
    $( "#levelGreenText" ).text(t("minor threat"));
    $( "#levelYellowText" ).text(t("potentially dangerous"));
    $( "#levelOrangeText" ).text(t("dangerous"));
    $( "#levelRedText" ).text(t("very dangerous"));

    var dayControlDiv = document.createElement('div');
    var dayControl = new DayControl(dayControlDiv, map);

    dayControlDiv.index = 1;
    // dayControlDiv.style['padding-top'] = '10px';
    dayControlDiv.style['border'] = 'none';

    if(dayControll !== undefined)
    map.removeControl(dayControll);
    
    addControlPlaceholders(map);
    dayControll = new L.Control.Zoom({ position: 'horizontalcentertop' }).addTo(map);
    
    dayControll._container.style['border'] = 'none';

    $(dayControll._container).html(dayControlDiv);

    // map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
    // map.controls[google.maps.ControlPosition.TOP_CENTER].push(dayControlDiv);

    updateEventSelect();
    updateData();

}

// Create additional Control placeholders
function addControlPlaceholders (mapObject) {
    var corners = mapObject._controlCorners,
        l = 'leaflet-',
        container = mapObject._controlContainer;

    function createCorner(vSide, hSide) {
        var className = l + vSide + ' ' + l + hSide;

        corners[vSide + hSide] = L.DomUtil.create('div', className, container);
    }

    createCorner('horizontalcenter', 'top');
    createCorner('horizontalcenter', 'bottom');
    createCorner('verticalcenter', 'left');
    createCorner('verticalcenter', 'right');
}

function updateData () {
    debug("Updating data:");
    $.getJSON("list.php",processCAP);
}

function testcircle (polygon,path) {

    // TODO

    // var bounds = polygon.getBounds();
    // var r1 = bounds.getSouthWest();
    // var r2 = bounds.getNorthEast();
    // var vertices = polygon.getPath();
    // var mindistance = 100000000000000;
    // var centerpoint;

    // for (i=1; i <= 40; i++) {
	// var step = (1/40);
	// var interpolated = google.maps.geometry.spherical.interpolate(r1, r2, step * i);

	// // Drop points that are not inside polygon
	// if (google.maps.geometry.poly.containsLocation(interpolated, polygon) == false)
	// 	continue;

	// var distance = 0;
	// for (var j =0; j < vertices.getLength(); j++) {
	//     var xy = vertices.getAt(j);
	//     distance = distance + google.maps.geometry.spherical.computeDistanceBetween(xy, interpolated);
	    
	// } // for

	// if (distance < mindistance)
	//     {
	// 	mindistance = distance;
	// 	centerpoint = interpolated;
	//     } // fi
    // } // for

    // return centerpoint;
    return false
}

function centerUserLocation () {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(function(position) {
		var pos = {
		    lat: position.coords.latitude,
		    lng: position.coords.longitude
		};

        var icon = L.icon({
            iconUrl: '../img/location.svg'
        });

        var marker = L.marker(pos,{icon: icon}).addTo(map);
        map.setView([position.coords.latitude,position.coords.longitude]);
        
	    }, function() {
		    debug("Unable to get location");
        });
        
    } else {
        // Browser doesn't support Geolocation
        debug("Browser doesn't support Geolocation");
    }
}

function showMarkers(day) {
    for (var i = 0; i < markers.length; i++) {
	var fromDate = new Date(markers[i].options.fromDate);
	var toDate = new Date(markers[i].options.toDate);

	if (polygons[i].options.polygonArea < alertOptions.areaLimitForMarkers)
	    {
        markers[i].getElement().style.display = 'none'; 
	    }
	else if (day == null || day == 'undefined') 
	    {
		if (~polygons[i].options.capEvent.indexOf(selectedEVENT) || selectedEVENT == null)
            markers[i].getElement().style.display = 'inline'; 
		else
            markers[i].getElement().style.display = 'none';             
	    }
	else if (fromDate.isBeforeDay(day) && toDate.isAfterDay(day))
	    {
		if (~polygons[i].options.capEvent.indexOf(selectedEVENT) || selectedEVENT == null)
            markers[i].getElement().style.display = 'inline';             
		else
            markers[i].getElement().style.display = 'none';             
	    }
	else
        markers[i].getElement().style.display = 'none';         
    }
    debug('Number of markers: ' + markers.length);
}

function showPolygons(day) {
    for (var i = 0; i < polygons.length; i++) {

	var fromDate = new Date(polygons[i].options.fromDate);
	var toDate = new Date(polygons[i].options.toDate);
	
	if (day == null) {
	    if (~polygons[i].options.capEvent.indexOf(selectedEVENT) || selectedEVENT == null) {
            polygons[i].getElement().style.display = 'inline'; 
        } else {
            polygons[i].getElement().style.display = 'none';
        } 
	}
	else if (fromDate.isBeforeDay(day) && toDate.isAfterDay(day)) {
	    if (~polygons[i].options.capEvent.indexOf(selectedEVENT) || selectedEVENT == null) {
            polygons[i].getElement().style.display = 'inline';
        } else {
            polygons[i].getElement().style.display = 'none';
        }
	}
	else
        polygons[i].getElement().style.display = 'none';
    }
    debug('Number of polygons: ' + polygons.length);
}

function processCAP(json) {
    debug("Loaded JSON: " + json);

    // Clear all markers
    // clear all previous polygons and markers before adding new ones
    mapPolygons.clearLayers();
    mapMarkers.clearLayers();
    markers = [];

    // Clear all polygons
    // clear all previous polygons and markers before adding new ones
    mapPolygons.clearLayers();
    mapMarkers.clearLayers();
    polygons = [];
    
    if(json !== null) {
      for (var i=0;i<json.length;i++)
	{
	    debug("Loading CAP file: " + json[i]);
	    $.get(json[i], function( data ) {
		    doCAP(data);
		});    
	}
    }
}

function DayControl(controlDiv, map) {

    if (alertOptions.dayControl == false)
	return;
    // We set up a variable for this since we're adding event listeners later.
    var control = this;

    // Set the center property upon construction
    //    control.center_ = center;
    controlDiv.style.clear = 'both';

    if (alertOptions.day0Control == true)
	{
	    // Set CSS for the control border
	    var setDay0UI = document.createElement('div');
	    setDay0UI.id = 'setDay0UI';
	    setDay0UI.title = t('Click to show alerts for today.');
	    controlDiv.appendChild(setDay0UI);
	    
	    // Set CSS for the control interior
	    var setDay0Text = document.createElement('div');
	    setDay0Text.id = 'setDay0Text';
	    setDay0Text.innerHTML = t('Today');
	    setDay0UI.appendChild(setDay0Text);

	    // Set up the click event listener for day buttons on top.
	    setDay0UI.addEventListener('click', function() {
		    selectedDAY = 0;
		    showMarkers(0);
		    showPolygons(0);
		    debug("Show events for today.");
		});
	}
    
    if (alertOptions.day1Control == true)
	{
	    // Set CSS for the setDay1 control border
	    var setDay1UI = document.createElement('div');
	    setDay1UI.id = 'setDay1UI';
	    setDay1UI.title = t('Click to show alerts for tomorrow.');
	    controlDiv.appendChild(setDay1UI);
	    
	    // Set CSS for the control interior
	    var setDay1Text = document.createElement('div');
	    setDay1Text.id = 'setDay1Text';
	    setDay1Text.innerHTML = t('Tomorrow');
	    setDay1UI.appendChild(setDay1Text);
	    
	    setDay1UI.addEventListener('click', function() {
		    selectedDAY = 1;
		    showMarkers(1);
		    showPolygons(1);
		    debug("Show events for tomorrow.");
		});
	} // if

    if (alertOptions.day2Control == true)
	{
	    // Set CSS for the setCenter control border
	    var setDay2UI = document.createElement('div');
	    setDay2UI.id = 'setDay2UI';
	    setDay2UI.title = t('Click to show alerts for day after tomorrow');
	    controlDiv.appendChild(setDay2UI);
	    
	    // Set CSS for the control interior
	    var setDay2Text = document.createElement('div');
	    setDay2Text.id = 'setDay2Text';
	    setDay2Text.innerHTML = t('Day after tomorrow');
	    setDay2UI.appendChild(setDay2Text);

	    setDay2UI.addEventListener('click', function() {
		    selectedDAY = 2;
		    showMarkers(2);
		    showPolygons(2);
		    debug("Show events for the day after tomorrow.");
		});
	} // if

    if (alertOptions.allDayControl == true)
	{
	    // Set CSS for the setAllDay control border
	    var setAllDaysUI = document.createElement('div');
	    setAllDaysUI.id = 'setAllDaysUI';
	    setAllDaysUI.title = t('Click to show all active alerts');
	    controlDiv.appendChild(setAllDaysUI);
	    
	    
	    // Set CSS for the control interior
	    var setAllDaysText = document.createElement('div');
	    setAllDaysText.id = 'setAllDaysText';
	    setAllDaysText.innerHTML = t('All');
	    setAllDaysUI.appendChild(setAllDaysText);

	    setAllDaysUI.addEventListener('click', function() {
		    selectedDAY = null;
		    showMarkers(null);
		    showPolygons(null);
		    debug("Show all events.");
		});
	} // fi

}

function doCAP(dom) {
    console.log('Selected day number: ',selectedDAY);
    debug("Loaded CAP:\n" + 
	  "- Identifier: " + dom.querySelector('identifier').textContent + "\n"+
	  //"- Web:     " + (dom.querySelector('web').textContent || "") + "\n"+
	  "- Sent by: " + dom.querySelector('sender').textContent + "\n"+
	  "- Sent at: " + dom.querySelector('sent').textContent);
 
    var alert = dom.querySelector('alert');
    var info  = alert.querySelector('info');
    var infos  = alert.querySelectorAll('info');
    var area  = info.querySelector('areaDesc').textContent;
    var severity  = info.querySelector('severity').textContent;
    var areapolygons = info.querySelectorAll('polygon');
    var parameters = info.querySelectorAll('parameter');
    var d = new Date(alert.querySelector('sent').textContent);
    var windSpeed,windDirection,waveHeight,waveDirection,swellHeight,surfHeight;
    var eventSelector = info.querySelector('event').textContent.replace('High Seas','').replace('Severe weather for','').replace('Moderate to Fresh','').replace('Gale force','').replace('Strong','').replace("Moderate","").replace('Heavy','').trim().split(' ')[0].trim().toLowerCase();
    var eventRaw = info.querySelector('event').textContent.toLowerCase();

    // Check available languages
    languages = [];
    for (var ie=0;ie<infos.length;ie++) {
	if (infos[ie].querySelector('language').textContent == selectedLANGUAGE)
	    info = infos[ie];
	languages.push(infos[ie].querySelector('language').textContent);
    }
    debug("Languages: " + languages);

    // Use CAP field onset if available (f.eg. SmartAlert)
    // Otherwise use CAP field effective (f.eg. NOAA) 
    if (info.querySelector('onset')) 
	{
	    var fromDate = new Date(info.querySelector('onset').textContent);
	    var fromDateISO = info.querySelector('onset').textContent;
	}
    else if (info.querySelector('effective')) 
	{
	    var fromDate = new Date(info.querySelector('effective').textContent);
	    var fromDateISO = info.querySelector('effective').textContent;
	}

    var toDate = new Date(info.querySelector('expires').textContent);
    var dnow = new Date();

    if (!toDate.isAfterDay(0))
    	return;

    events.push(eventSelector);

    debug('Event: ' + events);
    debug('Area Description: ' + area);
    debug('Number of polygons: ' + areapolygons.length);

    for (var v=0;v<parameters.length;v++) {
	if (parameters[v].querySelector('valueName').textContent == "WindSpeed")
	    windSpeed = Math.round(parameters[v].querySelector('value').textContent);
	if (parameters[v].querySelector('valueName').textContent == "WindDirection")
	    windDirection = Math.round(parameters[v].querySelector('value').textContent);
	if (parameters[v].querySelector('valueName').textContent == "WaveHeight")
	    waveHeight = Math.round(parameters[v].querySelector('value').textContent);
	if (parameters[v].querySelector('valueName').textContent == "SwellHeight")
	    swellHeight = Math.round(parameters[v].querySelector('value').textContent);
	if (parameters[v].querySelector('valueName').textContent == "SurfHeight")
	    surfHeight = Math.round(parameters[v].querySelector('value').textContent);
	debug(parameters[v].querySelector('valueName').textContent);
	debug(parameters[v].querySelector('value').textContent);
    }
    
    for (p=0;p<areapolygons.length;p++) {
	    var color;
	    var zindex;
	    var latLngs = areapolygons[p].textContent.split(' ');

	    //debug(latLngs);
	    
	    //create polygon
	    var i, latLng, path = [];
	    
	    for (i=0;i<latLngs.length-1;i++) {
            var latLng = latLngs[i].split(',');
            path.push(new L.LatLng(parseFloat(latLng[0]), parseFloat(latLng[1])));
	    }

	    switch(severity) {
	    case "Extreme":
		// Red
		color = "#FF0000";
		zindex = 4;
		break;
	    case "Severe":
		// Orange
		color = "#FFA500";
		zindex = 3;
		break;
	    case "Moderate":
		// Yellow
		color = "#FFFF00";
		zindex = 2;
		break;
	    case 'Minor':
		// Green
		color = "#00FF00";
		zindex = 1;
		break;
	    default:
		color = "#FFFFFF";
        }

        var areapolygon = L.polygon(path, {
            paths: path,
		    color: color,
		    fillOpacity: alertOptions.polygonOptions.fillOpacity,
		    strokeColor: color,
		    strokeOpacity: alertOptions.polygonOptions.strokeOpacity,
		    strokeWeight: alertOptions.polygonOptions.strokeWeight,
		    map: map,
		    visible: false,
		    fromDate: fromDateISO,
		    toDate: info.querySelector('expires').textContent,
		    capEvent: eventRaw,
            //polygonArea: google.maps.geometry.spherical.computeArea(path),
            polygonArea: polygonArea(path),
		    zIndex: zindex
        })

        // add polygons to a polygongroup
        areapolygon.addTo(mapPolygons);
        mapPolygons.addTo(map)

	    polygons.push(areapolygon);
	    var bounds = areapolygon.getBounds();

        // TODO
	    // if (polygonArea(path) > 1)
		// var markerLocation = testcircle(areapolygon);
        // else
        var markerLocation = bounds.getCenter();
        console.log('event: ',eventRaw);

	if (windSpeed > 0)
        var icon = L.icon({
            iconUrl: 'img/wind.php?speed='+windSpeed+'&direction='+windDirection,
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth, alertOptions.iconHeight],
            popupAnchor: [alertOptions.iconWidth, alertOptions.iconHeight]
        });

	else if (waveHeight > 0) 
        var icon = L.icon({
            iconUrl: 'img/wave.php?height='+waveHeight,
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [(-1)*alertOptions.iconWidth, (-1)*alertOptions.iconHeight],
            popupAnchor: [(-1)*alertOptions.iconWidth, (-1)*alertOptions.iconHeight]
        });

	else if (swellHeight > 0) 
        var icon = L.icon({
            iconUrl: 'img/wave.php?height='+swellHeight,
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth, (-1)*alertOptions.iconHeight],
            popupAnchor: [alertOptions.iconWidth, (-1)*alertOptions.iconHeight],
        });

	else if (surfHeight > 0) 
        var icon = L.icon({
            iconUrl: 'img/wave.php?height='+surfHeight,
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-30, 0],
            popupAnchor: [-30, 0]
        });

	// Earthquake
	else if (~eventRaw.indexOf("earthquake")) 
        var icon = L.icon({
            iconUrl: 'img/earthquake.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, -30],
            popupAnchor: [0, -30]
        });

	// Fire
	else if (~eventRaw.indexOf("fire")) 
        var icon = L.icon({
            iconUrl: 'img/fire.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, 0],
            popupAnchor: [0, 0]
        });

	// Drought
	else if (~eventRaw.indexOf("drought")) 
        var icon = L.icon({
            iconUrl: 'img/drought.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [15, 15],
            popupAnchor: [15, 15]
        });

	else if (~eventRaw.indexOf("craft")) 
        var icon = L.icon({
            iconUrl: 'img/smallcraft.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [15, -15],
            popupAnchor: [15, -15]
        });

	else if (~eventRaw.indexOf("dust")) 
	    var icon = L.icon({
            iconUrl: 'img/dust.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth/(-2), alertOptions.iconHeight/2],
            popupAnchor: [lertOptions.iconWidth/(-2), lertOptions.iconHeight/2]
        });

	else if (~eventRaw.indexOf("gale")) 
	    var icon = L.icon({
            iconUrl: 'img/gale.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth/2, alertOptions.iconHeight/(-2)],
            popupAnchor: [lertOptions.iconWidth/2, lertOptions.iconWidth/(-2)]
        });

	else if (~eventRaw.indexOf("fog")) 
	    var icon = L.icon({
            iconUrl: 'img/fog.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth/(-2), alertOptions.iconHeight/(-2)],
            popupAnchor: [lertOptions.iconWidth/(-2), lertOptions.iconHeight/(-2)]
        });

        else if (~eventRaw.indexOf("flood"))
        var icon = L.icon({
            iconUrl: 'img/flood.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [25, 25],
            popupAnchor: [25, 25]
        });

	else if (~eventRaw.indexOf("frost")) 
        var icon = L.icon({
            iconUrl: 'img/frost.png',
            iconSize: [alertOptions.iconWidth*2.5, alertOptions.iconHeight*2.5],
            iconAnchor: [25, 25],
            popupAnchor: [25, 25],
        });

	else if (~eventRaw.indexOf("heat")) 
        var icon = L.icon({
            iconUrl: 'img/temperature.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, 0],
            popupAnchor: [0, 0]
        });

	else if (~eventRaw.indexOf("extreme")) 
        var icon = L.icon({
            iconUrl: 'img/cold.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-15, 15],
            popupAnchor: [30, 0],
        });

	else if (~eventRaw.indexOf("cold")) 
        var icon = L.icon({
            iconUrl: 'img/cold.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-5, 0],
            popupAnchor: [-5, 0]
        });

	else if (~eventRaw.indexOf("temperature")) 
        var icon = L.icon({
            iconUrl: 'img/temperature.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, 0],
            popupAnchor: [0, 0]
        });
        
	// Rainfall Icon
	else if (~eventRaw.indexOf("rain")) 
        var icon = L.icon({
            iconUrl: 'img/rainfall.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [25, -25],
            popupAnchor: [25, -25],
        });

        else if (~eventRaw.indexOf("snow"))
        var icon = L.icon({
            iconUrl: 'img/snow.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, -10],
            popupAnchor: [0, -10]
        });

        // Placeholder for sleet
        else if (~eventRaw.indexOf("sleet"))
        var icon = L.icon({
            iconUrl: 'img/sleet.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-25, -25],
            popupAnchor: [-25, -25],
        });

        // Placeholder for snowfall
        else if (~eventRaw.indexOf("wet snow"))
        var icon = L.icon({
            iconUrl: 'img/snow.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth/2, alertOptions.iconHeight/2],
            popupAnchor: [alertOptions.iconWidth/2, alertOptions.iconHeight/2]
        });

        else if (~eventRaw.indexOf("wind"))
            var icon = L.icon({
            iconUrl: 'img/strong-wind.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth*1.24, alertOptions.iconHeight],
            popupAnchor: [alertOptions.iconWidth*1.24, alertOptions.iconHeight]
        });

	    // Tsunami Icon
	    else if (~eventRaw.indexOf("tsunami")) 
        var icon = L.icon({
            iconUrl: 'img/tsunami.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth/2, alertOptions.iconHeight/2],
            popupAnchor: [alertOptions.iconWidth/2, alertOptions.iconWidth/2,]
        });

	else if (~eventRaw.indexOf("tornado")) 
        var icon = L.icon({
            iconUrl: 'img/tornado.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, 0],
            popupAnchor: [0, 0]
        });

	    else if (~eventRaw.indexOf("waterspout")) 
        var icon = L.icon({
            iconUrl: 'img/waterspout.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth*(-1), alertOptions.iconWidth*(-1)],
            popupAnchor: [alertOptions.iconWidth*(-1), alertOptions.iconWidth*(-1)]
        });


	    else if (eventSelector == "volcanic") 
        var icon = L.icon({
            iconUrl: 'img/volcano.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [alertOptions.iconWidth*(-0.5), alertOptions.iconHeight*(-0.5)],
            popupAnchor: [alertOptions.iconWidth*(-0.5), alertOptions.iconWidth*(-0.5)]
        });

	    else if (~eventRaw.indexOf("thunderstorm")) 
        var icon = L.icon({
            iconUrl: 'img/thunderstorm.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-10, -10],
            popupAnchor: [-10, -10]
        });

	    else if (~eventRaw.indexOf("storm")) 
        var icon = L.icon({
            iconUrl: 'img/thunderstorm.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-30, -30],
            popupAnchor: [-30, -30]
        });

	    else if (~eventRaw.indexOf("hail")) 
        var icon = L.icon({
            iconUrl: 'img/hail.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [15, 15],
            popupAnchor: [15, 15]
        });

	    else if (~eventRaw.indexOf("hurricane")) 
        var icon = L.icon({
            iconUrl: 'img/tropical-hurricane.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [10, 40],
            popupAnchor: [10, 40]
        });

	    else if (~eventRaw.indexOf("tropical storm")) 
        var icon = L.icon({
            iconUrl: 'img/tropical-storm.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [0, 0],
            popupAnchor: [0, 0]
        });

	    else if (~eventRaw.indexOf("depression")) 
        var icon = L.icon({
            iconUrl: 'img/tropical-depression.png',
            iconSize: [alertOptions.iconWidth, alertOptions.iconHeight],
            iconAnchor: [-20, -20],
            popupAnchor: [-20, -20]
        });

	    else if (~eventRaw.indexOf("tropical")) 
        var icon = L.icon({
            iconUrl: 'img/cyclone.png',
            iconSize: [alertOptions.iconWidth*1.2, alertOptions.iconHeight*1.2],
            iconAnchor: [alertOptions.iconWidth*1.2, alertOptions.iconHeight*1.2],
            popupAnchor: [0, 0]
        });
        

        var marker;
        if (icon != null) 
        {
            // create a marker for polygon
            marker = L.marker(markerLocation, 
                {
                    icon: icon,
                    visible: false,
                    icon: icon,
                    fromDate: fromDateISO,
                    toDate: info.querySelector('expires').textContent,
                    capEvent: eventRaw,
                    zIndex: zindex
                })
                marker.addTo(mapMarkers);
                mapMarkers.addTo(map);
        }
        else
        {
            // create a marker for polygon
            // marker = new google.maps.Marker({
            //     position: markerLocation,
            //     label: eventSelector.charAt(0).toUpperCase(),
            //     map: map,
            //     visible: false,
            //     fromDate: fromDateISO,
            //     toDate: info.querySelector('expires').textContent,
            //     capEvent: eventRaw,
            //     zIndex: zindex
            // });
            marker = L.marker(markerLocation, {icon: null})
            marker.addTo(mapMarkers);
            mapMarkers.addTo(map);
        }

        //create an infowindow 
        var sender;
        if (info.querySelector('senderName'))
        sender = info.querySelector('senderName').textContent;
        else
        sender = alert.querySelector('sender').textContent;

        if (alert.querySelector('web'))
        sender = '<a href="http://'+ dom.querySelector('web').textContent + '">'+sender+'</a>';

        $("#senderName").html(sender);

        if (dnow.getTime() > fromDate.getTime())
        var active_str = '<i>' + t('Active for next') + ' <b>'+toDate.dateDiff()+'</b></i>';
        else
        var active_str = '';

        // var infowindow = new google.maps.InfoWindow({
        var content = '<h4 class="iw-title">' + info.querySelector('event').textContent + ' ' + t('for') + ' ' +info.querySelector('areaDesc').textContent +'</h4>'
        + '<i>' + t('Valid from')+' <b>'+fromDate.toLocaleString()+'</b><br>'+ t('to') +' <b>'+toDate.toLocaleString()+'</b></i><br/>'
        + active_str 
        + '<p>' + ( info.querySelector('description') ? info.querySelector('description').textContent : "" )+'</p>'
        + '<p><i>' + t('Issued by') + ' ' + sender
        + ' '+  t('at') + ' '+d.toLocaleString()+' ('+d.dateDiff()+')</i></p>'
        

        // bind markers to marker and polygon
        marker.bindPopup(content,{
            maxWidth: 220
        }).addTo(map)
        areapolygon.bindPopup(content,{
            maxWidth: 220
        }).addTo(map)

        markers.push(marker);

	} // for loop

    showMarkers(selectedDAY);
    showPolygons(selectedDAY);
    debug(events);
};    


// http://www.mathopenref.com/coordpolygonarea2.html
function polygonArea(path) { 

    var numPoints = path.length
    X = [];
    Y = [];

    for (var i =0; i < numPoints; i++) {
        X.push(path[i].lat)
        Y.push(path[i].lng)
    }
    area = 0;         // Accumulates area in the loop
    j = numPoints-1;  // The last vertex is the 'previous' one to the first
    for (i=0; i<numPoints; i++) { 
        area = area +  (X[j]+X[i]) * (Y[j]-Y[i]); 
        j = i;  //j is previous vertex to i
    }
    return Math.abs(area/2);
}
