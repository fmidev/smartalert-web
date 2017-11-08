
var DEBUG = true;
var map;
var markers = [];
var polygons = [];
var languages = [];
var events = [];
var selectedDAY = null;
var selectedEVENT = null;
var translations = {};

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

if (!google.maps.Polygon.prototype.getBounds) {
    google.maps.Polygon.prototype.getBounds=function(){
	var bounds = new google.maps.LatLngBounds()
	this.getPath().forEach(function(element,index){bounds.extend(element)})
	return bounds
    }
}

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

    var mapOptions = {
	zoom: alertOptions.zoom,
	center: alertOptions.center,
	mapTypeId: google.maps.MapTypeId.TERRAIN,
	mapTypeControl: false,
	streetViewControl: false,
	scaleControl: true,
	zoomControl: true,
	zoomControlOptions: {
	    position: google.maps.ControlPosition.RIGHT_CENTER
	},
    };




    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('legend'));
    centerUserLocation();
    map.fitBounds(alertOptions.bounds);

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
    $( "#levelYellowText" ).text(t("potentially dangerous"));
    $( "#levelOrangeText" ).text(t("dangerous"));
    $( "#levelRedText" ).text(t("very dangerous"));

    var dayControlDiv = document.createElement('div');
    var dayControl = new DayControl(dayControlDiv, map);

    dayControlDiv.index = 1;
    dayControlDiv.style['padding-top'] = '10px';
    map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(dayControlDiv);

    updateEventSelect();
    updateData();

}


function updateData () {
    debug("Updating data:");
    $.getJSON("list.php",processCAP);
}

function testcircle (polygon) {
    var bounds = polygon.getBounds();
    var r1 = bounds.getSouthWest();
    var r2 = bounds.getNorthEast();
    var vertices = polygon.getPath();
    var mindistance = 100000000000000;
    var centerpoint;

    for (i=1; i <= 40; i++) {
	var step = (1/40);
	var interpolated = google.maps.geometry.spherical.interpolate(r1, r2, step * i);

	// Drop points that are not inside polygon
	if (google.maps.geometry.poly.containsLocation(interpolated, polygon) == false)
		continue;

	var distance = 0;
	for (var j =0; j < vertices.getLength(); j++) {
	    var xy = vertices.getAt(j);
	    distance = distance + google.maps.geometry.spherical.computeDistanceBetween(xy, interpolated);
	    
	} // for

	if (distance < mindistance)
	    {
		mindistance = distance;
		centerpoint = interpolated;
	    } // fi
    } // for

    return centerpoint;
}

function centerUserLocation () {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(function(position) {
		var pos = {
		    lat: position.coords.latitude,
		    lng: position.coords.longitude
		};
		
		var bluedot = {
		    path: 'M-6,0a6,6 0 1,0 12,0a6,6 0 1,0 -12,0',
		    fillColor: '#1E90FF',
		    fillOpacity: 0.7,
		    scale: 1,
		    strokeColor: 'blue',
		    strokeWeight: 1
		};
		
		var marker = new google.maps.Marker({
			    position: pos,
			    icon: bluedot,
			    map: map
		    });

		map.setCenter(pos);

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

	var fromDate = new Date(markers[i].fromDate);
	var toDate = new Date(markers[i].toDate);


	if (polygons[i].polygonArea < alertOptions.areaLimitForMarkers)
	    {
		markers[i].setVisible(false);
	    }
	else if (day == null) 
	    {
		if (~polygons[i].capEvent.indexOf(selectedEVENT) || selectedEVENT == null)
		    markers[i].setVisible(true);
		else
		    markers[i].setVisible(false);
	    }
	else if (fromDate.isBeforeDay(day) && toDate.isAfterDay(day))
	    {
		if (~polygons[i].capEvent.indexOf(selectedEVENT) || selectedEVENT == null)
		    markers[i].setVisible(true);
		else
		    markers[i].setVisible(false);
	    }
	else
	    markers[i].setVisible(false);
    }
    debug('Number of markers: ' + markers.length);
}

function showPolygons(day) {
    for (var i = 0; i < polygons.length; i++) {

	var fromDate = new Date(polygons[i].fromDate);
	var toDate = new Date(polygons[i].toDate);
	
	if (day == null) {
	    if (~polygons[i].capEvent.indexOf(selectedEVENT) || selectedEVENT == null)
		polygons[i].setVisible(true);
	    else
	    	polygons[i].setVisible(false);
	}
	else if (fromDate.isBeforeDay(day) && toDate.isAfterDay(day)) {
	    if (~polygons[i].capEvent.indexOf(selectedEVENT) || selectedEVENT == null)
		polygons[i].setVisible(true);
	    else
		polygons[i].setVisible(false);
	}
	else
	    polygons[i].setVisible(false);
    }
    debug('Number of polygons: ' + polygons.length);
}

function processCAP(json) {
    debug("Loaded JSON: " + json);

    // Clear all markers
    for (var i = 0; i < markers.length; i++) {
	markers[i].setMap(null);
    }
    markers = [];

    // Clear all polygons
    for (var i = 0; i < polygons.length; i++) {
	polygons[i].setMap(null);
    }
    polygons = [];

    for (var i=0;i<json.length;i++)
	{
	    debug("Loading CAP file: " + json[i]);
	    $.get(json[i], function( data ) {
		    doCAP(data);
		});    
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
		    showMarkers();
		    showPolygons();
		    debug("Show all events.");
		});
	} // fi

}

function doCAP(dom) {

    debug("Loaded CAP:\n" + 
	  "- Identifier: " + dom.querySelector('identifier').textContent +"\n"+
	  "- Web:     " + dom.querySelector('web').textContent +"\n"+
	  "- Sent by: " + dom.querySelector('sender').textContent +"\n"+
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
    
    for (p=0;p<areapolygons.length;p++)
	{
	    var color;
	    var zindex;
	    var latLngs = areapolygons[p].textContent.split(' ');

	    //debug(latLngs);
	    
	    //create polygon
	    var i, latLng, path = [];
	    
	    for (i=0;i<latLngs.length-1;i++) {
		var latLng = latLngs[i].split(',');
		//console.log(latLng);
		path.push(new google.maps.LatLng(parseFloat(latLng[0]), parseFloat(latLng[1])));
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

	    var areapolygon = new google.maps.Polygon({
		    paths: path,
		    fillColor: color,
		    fillOpacity: alertOptions.polygonOptions.fillOpacity,
		    strokeColor: color,
		    strokeOpacity: alertOptions.polygonOptions.strokeOpacity,
		    strokeWeight: alertOptions.polygonOptions.strokeWeight,
		    map: map,
		    visible: false,
		    fromDate: fromDateISO,
		    toDate: info.querySelector('expires').textContent,
		    capEvent: eventRaw,
		    polygonArea: google.maps.geometry.spherical.computeArea(path),
		    zIndex: zindex
		});
	    //debug(info.querySelector('event').textContent.split(' ')[0].trim());
	    polygons.push(areapolygon);
	    
	    var bounds = areapolygon.getBounds();

	    if (google.maps.geometry.spherical.computeArea(path) > 35000000)
		var markerLocation = testcircle(areapolygon);
	    else
	    	var markerLocation = bounds.getCenter();

	    if (windSpeed > 0)
		var icon = {
		    url: "img/wind.php?speed="+windSpeed+"&direction="+windDirection, 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight), // scaled size
		    anchor: new google.maps.Point(alertOptions.iconWidth/2, alertOptions.iconHeight/2)
		};
	    else if (waveHeight > 0) 
		var icon = {
		    url: "img/wave.php?height="+waveHeight, 
		    scaledSize: new google.maps.Size(30, 30), // scaled size
		    anchor: new google.maps.Point(0, 26)
		};

	    else if (swellHeight > 0) 
		var icon = {
		    url: "img/wave.php?height="+swellHeight, 
		    scaledSize: new google.maps.Size(30, 30), // scaled size
		    anchor: new google.maps.Point(0, 26)
		};

	    else if (surfHeight > 0) 
		var icon = {
		    url: "img/wave.php?height="+surfHeight, 
		    scaledSize: new google.maps.Size(30, 30), // scaled size
		    anchor: new google.maps.Point(0, 26)
		};

	    // Earthquake
	    else if (~eventRaw.indexOf("earthquake")) 
		var icon = {
		    url: "img/earthquake.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    // Fire
	    else if (~eventRaw.indexOf("fire")) 
		var icon = {
		    url: "img/fire.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    else if (~eventRaw.indexOf("craft")) 
		var icon = {
		    url: "img/smallcraft.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    else if (~eventRaw.indexOf("gale")) 
		var icon = {
		    url: "img/gale.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    else if (~eventRaw.indexOf("fog")) 
		var icon = {
		    url: "img/fog.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};


            else if (~eventRaw.indexOf("flood"))
                var icon = {
                    url: "img/flood.png",
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight), // scaled size,
                    anchor: new google.maps.Point(alertOptions.iconWidth, 0)
                };

	    else if (~eventRaw.indexOf("frost")) 
		var icon = {
		    url: "img/frost.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    else if (~eventRaw.indexOf("temperature")) 
		var icon = {
		    url: "img/temperature.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    // Rainfall Icon
	    else if (~eventRaw.indexOf("rain")) 
		var icon = {
		    url: "img/rainfall.png",
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight), 
		    anchor: new google.maps.Point(0, alertOptions.iconHeight)
		};

	    // Tsunami Icon
	    else if (~eventRaw.indexOf("tsunami")) 
		var icon = {
		    url: "img/tsunami.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    else if (~eventRaw.indexOf("tornado")) 
		var icon = {
		    url: "img/tornado.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};

	    else if (~eventRaw.indexOf("waterspout")) 
		var icon = {
		    url: "img/waterspout.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(0, 0)
		};


	    else if (eventSelector == "volcanic") 
		var icon = {
		    url: "img/volcano.png", 
		    scaledSize: new google.maps.Size(24, 24), // scaled size
		    anchor: new google.maps.Point(12, 12)
		};

	    else if (~eventRaw.indexOf("thunderstorm")) 
		var icon = {
		    url: "img/thunderstorm.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(alertOptions.iconWidth, alertOptions.iconHeight)
		};

	    else if (~eventRaw.indexOf("hail")) 
		var icon = {
		    url: "img/hail.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(alertOptions.iconWidth, alertOptions.iconHeight)
		};

	    else if (~eventRaw.indexOf("hurricane")) 
		var icon = {
		    url: "img/tropical-hurricane.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(12, 12)
		};

	    else if (~eventRaw.indexOf("tropical storm")) 
		var icon = {
		    url: "img/tropical-storm.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(12, 12)
		};

	    else if (~eventRaw.indexOf("depression")) 
		var icon = {
		    url: "img/tropical-depression.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(12, 12)
		};

	    else if (~eventRaw.indexOf("tropical")) 
		var icon = {
		    url: "img/cyclone.png", 
		    scaledSize: new google.maps.Size(alertOptions.iconWidth, alertOptions.iconHeight),
		    anchor: new google.maps.Point(12, 12)
		};

	    var marker;

	    if (icon != null ) 
		{

		    // create a marker for polygon
		    marker = new google.maps.Marker({
			    position: markerLocation,
			    map: map,
			    visible: false,
			    icon: icon,
			    fromDate: fromDateISO,
			    toDate: info.querySelector('expires').textContent,
			    capEvent: eventRaw,
			    zIndex: zindex
			});
		}
	    else
		{
		    // create a marker for polygon
		    marker = new google.maps.Marker({
			    position: markerLocation,
			    label: eventSelector.charAt(0).toUpperCase(),
			    map: map,
			    visible: false,
			    fromDate: fromDateISO,
			    toDate: info.querySelector('expires').textContent,
			    capEvent: eventRaw,
			    zIndex: zindex
			});
		}

	    markers.push(marker);

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

	    var infowindow = new google.maps.InfoWindow({
		    content: '<h4 class="iw-title">' + info.querySelector('event').textContent + ' ' + t('for') + ' ' +info.querySelector('areaDesc').textContent +'</h4>'
		    + '<i>' + t('Valid from')+' <b>'+fromDate.toLocaleString()+'</b><br>'+ t('to') +' <b>'+toDate.toLocaleString()+'</b></i><br/>'
		    + active_str 
		    + '<p>' + ( info.querySelector('description') ? info.querySelector('description').textContent : "" )+'</p>'
		    + '<p><i>' + t('Issued by') + ' ' + sender
		    + ' '+  t('at') + ' '+d.toLocaleString()+' ('+d.dateDiff()+')</i></p>',
		    
		    maxWidth: 220
		});

	    google.maps.event.addListener(marker, 'click', function() {
		    infowindow.open(map,this);
		});
	    google.maps.event.addListener(areapolygon, 'click', function () {
		    infowindow.open(map,this);
		}); 

	} // for loop


    showMarkers();
    showPolygons();
    debug(events);
  
};    
