
var DEBUG = false
var map
var markers = []
var polygons = []
var mapMarkers = L.layerGroup()
var mapPolygons = L.layerGroup()
var markerLocations = []
var xDisplacement = 0
var xDisplacementValue = 0
var languages = []
var events = []
var selectedEVENT = null
var translations = {}
var dayControll
var nameLayer
const squares = [];


// Remember previous state
var selectedLANGUAGE = localStorage.getItem('userLanguage') ? localStorage.getItem('userLanguage') : alertOptions.defaultLanguage
var selectedEVENT = localStorage.getItem('userEventType') ? localStorage.getItem('userEventType') : ''

var selectedDAY = alertOptions.allDayControl ? null
  : alertOptions.day0Control ? 0
    : alertOptions.day1Control ? 1
      : alertOptions.day2Control ? 2
        : alertOptions.day3Control ? 3
          : 4

function debug(str) {
  if (DEBUG) {
    try {
      console.log(str)
    } catch (e) { };
  }
}

function t(key) {
  if (translations[selectedLANGUAGE][key] != null) { return translations[selectedLANGUAGE][key] } else { return key }
}

Date.prototype.isBeforeDay = function (day) {
  var d = new Date()
  d.setDate(d.getDate() + day)
  d.setHours(23)
  d.setMinutes(59)
  d.setSeconds(59)
  d.setMilliseconds(999)

  debug(this + ' < ' + d)

  if (this.getTime() < d.getTime()) { return true } else { return false }
}

Date.prototype.isAfterDay = function (day) {
  var d = new Date()
  d.setDate(d.getDate() + day)
  d.setHours(0)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)

  debug('After check: ' + this + ' > ' + d)

  if (this.getTime() > d.getTime()) { return true } else { return false }
}

Date.prototype.dateDiff = function () {
  var date = this
  var now = new Date()
  var string = ''

  var diff = date - now
  var abs = Math.abs(date - now)
  var days = Math.floor(abs / 86400000)
  var hours = Math.floor(abs % 86400000 / 3600000)
  var minutes = Math.floor(abs % 86400000 % 3600000 / 60000)

  if (days == 1) { string = string + days + ' ' + t('day') + ' ' } else if (days > 1) { string = string + days + ' ' + t('days') + ' ' }

  if (hours == 1) { string = string + hours + ' ' + t('hour') + ' ' } else if (hours > 1) { string = string + hours + ' ' + t('hours') + ' ' }

  if (minutes == 1) { string = string + minutes + ' ' + t('minute') + ' ' } else if (minutes > 1 || minutes == 0) { string = string + minutes + ' ' + t('minutes') + ' ' }

  if (diff < 0) { string = string + t('ago') }

  return string
}

function initialize() {
  buildLegend()
  map = L.map('map-canvas', {
    zoom: alertOptions.zoom,
    fullscreenControl: true,
    scrollWheelZoom: true,
    center: alertOptions.center
  })

  // use map panes to set layer z-index values
  map.createPane('Extreme');
  map.getPane('Extreme').style.zIndex = 585;
  map.createPane('Severe');
  map.getPane('Severe').style.zIndex = 584;
  map.createPane('Moderate');
  map.getPane('Moderate').style.zIndex = 583;
  map.createPane('Minor');
  map.getPane('Minor').style.zIndex = 582;
  map.createPane('Default');
  map.getPane('Default').style.zIndex = 581;

  // user location disabled
  if (alertOptions.useLocation == true) { centerUserLocation() }

  // mapbox access token
  // https://www.mapbox.com/account/

  if (alertOptions.displayWMS) {
    var wmsLayer = L.tileLayer.wms(alertOptions.displayOptions.endpoint, alertOptions.displayOptions.params).addTo(map);
  }

  map.createPane('labels');
  // This pane is above markers but below popups
  map.getPane('labels').style.zIndex = 590;
  // Layers in this pane are non-interactive and do not obscure mouse/touch events
  map.getPane('labels').style.pointerEvents = 'none';
  nameLayer = L.tileLayer(alertOptions.mapTileSource, {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="' + alertOptions.attributionLink + '">' + alertOptions.attribution + '</a>',
    pane: 'labels',
    opacity: 0.5
  }).addTo(map)

  nameLayer = L.tileLayer(alertOptions.mapTileSource, {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, <a href="' + alertOptions.attributionLink + '">' + alertOptions.attribution + '</a>',
    opacity: 1
  }).addTo(map)

  //make a new marker and add it to its layer
  const addMarker = (lat, lng, name, color, markerLayer) => {
    if (lat != null && lng != null) {
      var marker = L.circleMarker([lat, lng], {
        radius: 2,
        color: color,
        weight: 6,
        opacity: 1,
      })
      marker.bindTooltip(name, {
        permanent: true,
        direction: 'center',
        offset: [0, 12],
        className: 'pointlabel'
      });
      markerLayer.addLayer(marker);
    }
  }

  var layerList = []
  // make a new layer with configured zoom levels and color
  const makeLayer = ({ maxZoom, minZoom, fillColor, locations }) => {
    const layer = {
      minZoom: minZoom,
      maxZoom: maxZoom,
      fillColor: fillColor,
      markerLayer: new L.FeatureGroup()
    }
    locations.map((item) => addMarker(item.lat, item.lon, item.name, fillColor, layer.markerLayer))
    layerList.push(layer)
  }

  if (alertOptions.customLocations) {
    // refresh wanted/unwanted layers on zoom
    map.on('zoomend', function () {
      layerList.map((layer) => {
        map.getZoom() < layer.minZoom || map.getZoom() > layer.maxZoom ?
          map.removeLayer(layer.markerLayer) : map.addLayer(layer.markerLayer)
      })
    })
    locations.map((item) => makeLayer(item))
  }

  var southWest = new L.LatLng(alertOptions.bounds.south, alertOptions.bounds.east)
  var northEast = new L.LatLng(alertOptions.bounds.north, alertOptions.bounds.west)
  var bounds = new L.LatLngBounds(southWest, northEast)
  map.fitBounds(bounds, { padding: [5, 5] })

  document.getElementById('eventType').addEventListener('change', function () {
    debug('Event Type selected: ' + document.getElementById('eventType').value)
    if (document.getElementById('eventType').value != '') { selectedEVENT = document.getElementById('eventType').value } else { selectedEVENT = null }
    showMarkers(selectedDAY)
    showPolygons(selectedDAY)

  })

  $('#lang').html('')
  $(Object.keys(translations)).each(function (i, lang) {
    debug('Added language ' + lang + ' to language dropdown menu.')
    $('#lang').append($('<option>').attr('value', lang).text(translations[lang][lang]))
    if (lang === selectedLANGUAGE) { $('#lang').val(lang).change() }
  })

  $('#lang').on('change', function () {
    // Call the changeLanguage function
    changeLanguage();

    var Table = document.getElementById("legend-icon-names")
    Table.innerHTML = ""
    activeMarkerList = []
    showMarkers(selectedDAY)
    showPolygons(selectedDAY)

  });

  if (Object.keys(translations).length < 2) { $('#lang').css('display', 'none') }

  updateEventSelect()
  setInterval(updateData, alertOptions.refresh * 1000)
  changeLanguage()

  alertOptions.showIconLegend && initIconLegendButton()
  if (!alertOptions.showIconLegend) {
    document.getElementById("icon-legend-container").style.display = 'none'
    document.getElementById("icon-legend-button").style.display = 'none'
  }

}

function updateEventSelect() {
  $('#eventType').html('')
  $('#eventType').append($('<option>').attr('value', '').text(t('All Hazard Types')))
  $(Object.keys(alertOptions.eventTypes)).each(function (i, eventType) {
    debug('Added eventType ' + eventType + ' to eventType dropdown menu.')
    $('#eventType').append($('<option>').attr('value', eventType).text(t(alertOptions.eventTypes[eventType])))
    if (eventType === selectedEVENT) { $('#eventType').val(eventType).change() }
  })
}

function changeLanguage() {

  debug('Language selected: ' + document.getElementById('lang').value)
  selectedLANGUAGE = document.getElementById('lang').value
  localStorage.setItem('userLanguage', selectedLANGUAGE)

  // Translate Legend
  $('#levelNoneText').text(t('no awareness needed'))
  $('#levelGreenText').text(t('minor threat'))
  $('#levelYellowText').text(t('potentially dangerous'))
  $('#levelOrangeText').text(t('dangerous'))
  $('#levelRedText').text(t('very dangerous'))
  $('#icon-legend-header').text(t('Map legend'))

  document.querySelector('.leaflet-control-zoom-in').title = t('Zoom in');
  document.querySelector('.leaflet-control-zoom-out').title = t('Zoom out');
  var dayControlDiv = document.createElement('div')
  DayControl(dayControlDiv, map)

  dayControlDiv.index = 1
  // dayControlDiv.style['padding-top'] = '10px';
  dayControlDiv.style['border'] = 'none'

  if (dayControll !== undefined) { map.removeControl(dayControll) }

  addControlPlaceholders(map)
  dayControll = new L.Control.Zoom({ position: 'horizontalcentertop' }).addTo(map)
  dayControll._container.style['border'] = 'none'
  $(dayControll._container).html(dayControlDiv)

  updateEventSelect()
  updateData()
}

function buildLegend() {
  // Rebuild legend if useMinorThreat is true
  if (alertOptions.useMinorThreat) {
    var div = document.getElementById('legend-warning-types');
    div.innerHTML = ''; // Clear existing content

    // Legend data
    var levels = [
      { id: 'levelGreen', textId: 'levelGreenText', text: 'minor threat' },
      { id: 'levelOrange', textId: 'levelOrangeText', text: 'dangerous' },
      { id: 'levelYellow', textId: 'levelYellowText', text: 'potentially dangerous' },
      { id: 'levelRed', textId: 'levelRedText', text: 'very dangerous' }
    ];

    // Create table rows for the legend
    for (let i = 0; i < levels.length; i += 2) {
      var tr = document.createElement('tr');

      // Create and append first column (color and text)
      appendLegendCell(tr, levels[i].id, 'colorLegend');
      appendLegendCell(tr, levels[i].textId, '', levels[i].text);

      // Create and append second column (color and text)
      if (levels[i + 1]) {
        appendLegendCell(tr, levels[i + 1].id, 'colorLegend');
        appendLegendCell(tr, levels[i + 1].textId, '', levels[i + 1].text);
      }

      div.appendChild(tr);
    }
  }
}

// Helper function to append a cell to a row
function appendLegendCell(row, id, className = '', innerHTML = '') {
  var td = document.createElement('td');
  td.id = id;
  if (className) td.className = className;
  td.innerHTML = innerHTML;
  row.appendChild(td);
}


let activeMarkerList = []

const addToMapLegend = (object, day) => {
  var table = document.getElementById('legend-icon-names')
  var row = table.insertRow(table.rows.length)
  var cell1 = row.insertCell(0)
  var cell2 = row.insertCell(1)
  cell1.innerHTML = `<img src=\"${object.iconUrl}" width=\"30px\" height=\"30px\" border=\"1px solid black\">`
  cell2.innerHTML = object.name
  cell1.style.width = '45px';
}

// Create additional Control placeholders
function addControlPlaceholders(mapObject) {
  var corners = mapObject._controlCorners

  var l = 'leaflet-'

  var container = mapObject._controlContainer

  function createCorner(vSide, hSide) {
    var className = l + vSide + ' ' + l + hSide

    corners[vSide + hSide] = L.DomUtil.create('div', className, container)
  }

  createCorner('horizontalcenter', 'top')
  createCorner('horizontalcenter', 'bottom')
  createCorner('verticalcenter', 'left')
  createCorner('verticalcenter', 'right')
}

function updateData() {
  debug('Updating data:')
  if (alertOptions.subDirectories) {
    $.getJSON('list.php', { dir: alertOptions.subDirectories }, processCAP)
  } else {
    $.getJSON('list.php', processCAP)
    $.getJSON('lastUpdated.php', function (data) {
      if (alertOptions.showUpdateTime === true) {
        if (data) {

          const formattedLocalTimeWithOffset = convertUtcToLocal(data)

          $('#sentDate').html(`${t('Updated')}: ${formattedLocalTimeWithOffset}`)
          return
        }
        $('#sentDate').html(`${t('Updated')}: ${t('Unknown')}`)
      }
    })
  }
}

function centerUserLocation() {
  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      var icon = L.icon({
        iconUrl: '../img/location.svg'
      })

      var marker = L.marker(pos, { icon: icon }).addTo(map)
      map.setView([position.coords.latitude, position.coords.longitude])
    }, function () {
      debug('Unable to get location')
    })
  } else {
    // Browser doesn't support Geolocation
    debug("Browser doesn't support Geolocation")
  }
}

function findMatchingName(name) {
  for (let key in alertOptions.eventTypes) {
    if (name.includes(key)) {
      return t(alertOptions.eventTypes[key]);
    }
  }
  return "No key/value pair found";
}

function showMarkers(day) {
  for (var i = 0; i < markers.length; i++) {

    // also show legend for active markers
    if (alertOptions.showIconLegend) {
      const activeMarker = {
        iconUrl: markers[i].options.icon.options.iconUrl,
        name: findMatchingName(markers[i].options.capEvent),
        fromDate: markers[i].options.fromDate,
        toDate: markers[i].options.toDate
      }
      fromDate = new Date(activeMarker.fromDate)

      toDate = new Date(activeMarker.toDate)

      const isNewMarker = activeMarkerList.every(marker => marker.name !== activeMarker.name
        || marker.iconUrl !== activeMarker.iconUrl)

      const isDateInRange = (day === null) || (fromDate.isBeforeDay(day) && toDate.isAfterDay(day))

      if (isNewMarker && isDateInRange) {
        activeMarkerList.push(activeMarker)
        addToMapLegend(activeMarker, day)
      }
    }

    var fromDate = new Date(markers[i].options.fromDate)
    var toDate = new Date(markers[i].options.toDate)

    if (selectedEVENT !== null)
      var combinedEvents = selectedEVENT.split(',')
    else
      combinedEvents = [selectedEVENT]

    function shouldDisplayMarker(polygon, event, combinedEvents) {
      return (
        polygon.options.capEvent.includes(event) ||
        event === null ||
        combinedEvents.some(substring => polygon.options.capEvent.includes(substring))
      );
    }

    for (let n = 0; n < combinedEvents.length; n++) {
      const polygon = polygons[i];
      const marker = markers[i].getElement();

      // Hide marker if area is less than the limit
      if (polygon.options.polygonArea < alertOptions.areaLimitForMarkers) {
        marker.style.display = 'none';
        continue;
      }

      // Handle cases where day is not defined
      if (!day) {
        if (shouldDisplayMarker(polygon, combinedEvents[n], combinedEvents)) {
          marker.style.display = 'inline'; // Show marker
        } else {
          marker.style.display = 'none';   // Hide marker
        }
        continue;
      }

      // Handle cases where the day is within range
      if (fromDate.isBeforeDay(day) && toDate.isAfterDay(day)) {
        if (shouldDisplayMarker(polygon, combinedEvents[n], combinedEvents)) {
          marker.style.display = 'inline'; // Show marker
        } else {
          marker.style.display = 'none';   // Hide marker
        }
      } else {
        marker.style.display = 'none'; // Hide marker if day is not in range
      }
    }

  }
  debug('Number of markers: ' + markers.length)
  if (alertOptions.extendedDayControl) {
    square0.style.backgroundColor = checkButtonColor(0, polygons)
    square1.style.backgroundColor = checkButtonColor(1, polygons)
    square2.style.backgroundColor = checkButtonColor(2, polygons)
    square3.style.backgroundColor = checkButtonColor(3, polygons)
    square4.style.backgroundColor = checkButtonColor(4, polygons)
    square5.style.backgroundColor = checkButtonColor(5, polygons)
  }
}

function showPolygons(day) {
  for (var i = 0; i < polygons.length; i++) {
    var fromDate = new Date(polygons[i].options.fromDate)
    var toDate = new Date(polygons[i].options.toDate)

    if (selectedEVENT !== null)
      var combinedEvents = selectedEVENT.split(',')
    else
      combinedEvents = [selectedEVENT]

    for (var n = 0; n < combinedEvents.length; n++) {
      if (day == null) {
        if (~polygons[i].options.capEvent.indexOf(combinedEvents[n]) || combinedEvents[n] == null) {
          polygons[i].getElement().style.display = 'inline'
        } else {
          if (!combinedEvents.some(substring => (polygons[i].options.capEvent).includes(substring)))
            polygons[i].getElement().style.display = 'none'
        }
      } else if (fromDate.isBeforeDay(day) && toDate.isAfterDay(day)) {
        if (~polygons[i].options.capEvent.indexOf(combinedEvents[n]) || combinedEvents[n] == null) {
          polygons[i].getElement().style.display = 'inline'
        } else {
          if (!combinedEvents.some(substring => (polygons[i].options.capEvent).includes(substring)))
            polygons[i].getElement().style.display = 'none'
        }
      } else { polygons[i].getElement().style.display = 'none' }
    }
  }
  debug('Number of polygons: ' + polygons.length)
}
var data
function processCAP(json) {
  debug('Loaded JSON: ' + json)

  // Clear all markers
  // clear all previous polygons and markers before adding new ones
  mapMarkers.clearLayers()
  xDisplacement = 0;
  markerLocations = [];
  markers = []

  // Clear all polygons
  // clear all previous polygons and markers before adding new ones
  mapPolygons.clearLayers()

  polygons = []

  if (json !== null) {
    for (var i = 0; i < json.length; i++) {
      debug('Loading CAP file: ' + json[i])
      $.get(json[i], function (data) {
        doCAP(data)
      })
    }
  }
}


let highestWarningLevel = 'white'

const checkButtonColor = (dayIndex, layersArray) => {

  const warnings = {
    red: false,
    orange: false,
    yellow: false
  }

  for (const layer of layersArray) {
    if (layer.options.fromDate && layer.options.toDate) {
      const fromDate = new Date(layer.options.fromDate)
      const toDate = new Date(layer.options.toDate)

      if (fromDate.isBeforeDay(dayIndex) && toDate.isAfterDay(dayIndex)) {
        if (layer.options.fillColor === '#FF0000') {
          highestWarningLevel = 'red'
          warnings.red = true
        } else if (layer.options.fillColor === '#FFA500') {
          if (highestWarningLevel !== 'red') {
            highestWarningLevel = 'orange'
          }
          warnings.orange = true
        } else if (layer.options.fillColor === '#FFFF00') {
          if (highestWarningLevel !== 'red' && highestWarningLevel !== 'orange') {
            highestWarningLevel = 'yellow'
          }
          warnings.yellow = true
        }
      }
    }
  }
  if (dayIndex === 5) {
    return highestWarningLevel
  }

  if (warnings.red) {
    return 'red'
  } else if (warnings.orange) {
    return 'orange'
  } else if (warnings.yellow) {
    return 'yellow'
  } else {
    return 'white'
  }
}

let prevButton = null;

const setActiveButton = (selectedButton) => {

  selectedButton.classList.add('active')
  if (prevButton !== null && prevButton != selectedButton) {

    prevButton.classList.remove('active')

    var prevSquare = prevButton.querySelector('.color-square')
    if (prevSquare) {
      prevSquare.innerHTML = ''
    }
  }

  var square = selectedButton.querySelector('.color-square')
  if (square) {
    square.innerHTML = '&#10003;'
  }
  prevButton = selectedButton
}

const setEventListener = (selected, number, debugMsg) => {
  selected.addEventListener('click', function () {
    selectedDAY = number
    var Table = document.getElementById("legend-icon-names")
    Table.innerHTML = ""
    activeMarkerList = []
    showMarkers(number)
    showPolygons(number)
    setActiveButton(selected)
    debug(debugMsg)
  })
}

const generateDayText = (day) => {
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const index = day % 7
  let dayText = days[index]
  return t(dayText)
}

function generateDate(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const result = dayjs(date).format(alertOptions.dayDateFormat)
  return result;
}

function DayControl(controlDiv) {
  // Make the colored squares for day buttons if needed.
  if (alertOptions.extendedDayControl) {
    for (let i = 0; i < 6; i++) {
      window['square' + i] = document.createElement('div')
      window['square' + i].className = 'color-square'
      squares.push(window['square' + i])
    }
  }
  if (alertOptions.dayControl == false) { return }

  var today = new Date()
  var day = today.getDay()
  // Set the center property upon construction
  //    control.center_ = center;
  controlDiv.classList.add('controlDiv');

  const isExtended = alertOptions.extendedDayControl

  if (alertOptions.day0Control) {
    const setDay0UI = document.createElement('div')
    setDay0UI.id = 'setDay0UI'
    setDay0UI.title = t('Click to show alerts for today')
    const dayTextElement = document.createElement('div')
    const dayText = isExtended ? generateDayText(day) + '<br>' + generateDate(0) : t('Today')

    dayTextElement.innerHTML = dayText
    if (isExtended) {
      setDay0UI.appendChild(square0)
      dayTextElement.style.marginLeft = '30px'
    }
    setDay0UI.appendChild(dayTextElement)
    controlDiv.appendChild(setDay0UI)
    setEventListener(setDay0UI, 0)
  }

  if (alertOptions.day1Control) {
    const setDay1UI = document.createElement('div')
    setDay1UI.id = 'setDay1UI'
    setDay1UI.title = t('Click to show alerts for tomorrow')
    const dayTextElement = document.createElement('div')
    const dayText = isExtended ? generateDayText(day + 1) + '<br>' + generateDate(1) : t('Tomorrow')

    dayTextElement.innerHTML = dayText
    if (isExtended) {
      setDay1UI.appendChild(square1)
      dayTextElement.style.marginLeft = '30px'
    }

    setDay1UI.appendChild(dayTextElement)
    controlDiv.appendChild(setDay1UI)
    selectedDAY === 0 && setActiveButton(setDay1UI)
    setEventListener(setDay1UI, 1, 'Show events for tomorrow.')
  }

  if (alertOptions.day2Control) {
    const setDay2UI = document.createElement('div')
    setDay2UI.id = 'setDay2UI'
    setDay2UI.title = t('Click to show alerts for day after tomorrow')
    const dayTextElement = document.createElement('div')
    const dayText = isExtended ? generateDayText(day + 2) + '<br>' + generateDate(2) : t('Day after tomorrow')

    dayTextElement.innerHTML = dayText
    if (isExtended) {
      setDay2UI.appendChild(square2)
      dayTextElement.style.marginLeft = '30px'
    }
    setDay2UI.appendChild(dayTextElement)
    controlDiv.appendChild(setDay2UI)
    setEventListener(setDay2UI, 2, 'Show events for day after tomorrow.')
  }

  if (alertOptions.day3Control) {
    const setDay3UI = document.createElement('div')
    setDay3UI.id = 'setDay3UI'
    setDay3UI.title = t('Click to show alerts for day 4')

    const dayTextElement = document.createElement('div')
    const dayText = isExtended ? generateDayText(day + 3) + '<br>' + generateDate(3) : t('Day 4')

    dayTextElement.innerHTML = dayText
    if (isExtended) {
      setDay3UI.appendChild(square3)
      dayTextElement.style.marginLeft = '30px'
    }

    setDay3UI.appendChild(dayTextElement)
    controlDiv.appendChild(setDay3UI)
    setEventListener(setDay3UI, 3, 'Show events for day 4.')
  }

  if (alertOptions.day4Control) {
    const setDay4UI = document.createElement('div')
    setDay4UI.id = 'setDay4UI'
    setDay4UI.title = t('Click to show alerts for day 5')

    const dayTextElement = document.createElement('div')
    const dayText = isExtended ? generateDayText(day + 4) + '<br>' + generateDate(4) : t('Day 5')

    dayTextElement.innerHTML = dayText
    if (isExtended) {
      const square = document.createElement('div')
      setDay4UI.appendChild(square4)
      dayTextElement.style.marginLeft = '30px'
    }

    setDay4UI.appendChild(dayTextElement)
    controlDiv.appendChild(setDay4UI)
    setEventListener(setDay4UI, 4, 'Show events for day 5.')
  }

  if (alertOptions.allDayControl) {
    const setAllDaysUI = document.createElement('div')
    setAllDaysUI.id = 'setAllDaysUI'
    setAllDaysUI.title = t('Click to show all active alerts')

    const dayTextElement = document.createElement('div')
    const dayText = isExtended ? `${t('All')} <br> ${t('days')}` : t('All')

    dayTextElement.innerHTML = dayText
    if (isExtended) {
      setAllDaysUI.appendChild(square5)
      dayTextElement.style.marginLeft = '30px'
    }

    setAllDaysUI.appendChild(dayTextElement)
    controlDiv.appendChild(setAllDaysUI)
    selectedDAY === null && setActiveButton(setAllDaysUI)
    setEventListener(setAllDaysUI, null, 'Show all events.')
  }
}

function doCAP(dom) {
  xDisplacement = 0
  xDisplacementValue = 0
  debug('Loaded CAP:\n' +
    '- Identifier: ' + dom.querySelector('identifier').textContent + '\n' +
    // "- Web:     " + (dom.querySelector('web').textContent || "") + "\n"+
    '- Sent by: ' + dom.querySelector('sender').textContent + '\n' +
    '- Sent at: ' + dom.querySelector('sent').textContent)

  var alert = dom.querySelector('alert')
  var info = alert.querySelector('info')
  var infos = alert.querySelectorAll('info')
  var area = info.querySelector('areaDesc').textContent
  var severity = info.querySelector('severity').textContent
  var areapolygons = info.querySelectorAll('polygon')
  var parameters = info.querySelectorAll('parameter')
  var d = new Date(alert.querySelector('sent').textContent)
  var windSpeed, windDirection, waveHeight, waveDirection, swellHeight, surfHeight
  var eventSelector = info.querySelector('event').textContent
    .replace('High risk of', '')
    .replace('Very high risk of', '')
    .replace('Extreme risk of', '')
    .replace('Low', '')
    .replace('High', '')
    .replace('High Seas', '')
    .replace('Severe storm force', '')
    .replace('Hurricane force', '')
    .replace('Dense', '')
    .replace('Very', '')
    .replace('Very dense', '')
    .replace('Very heavy', '')
    .replace('Extremely heavy', '')
    .replace('Very intensive', '')
    .replace('Extremely intensive', '')
    .replace('Severe weather for', '')
    .replace('Moderate to Fresh', '')
    .replace('Very high', '')
    .replace('Gale force', '')
    .replace('Strong', '')
    .replace('Moderate', '')
    .replace('Heavy', '')
    .replace('Extreme', '')
    .replace('Severe', '')
    .replace('Intensive', '')
    .replace('High risk of', '')
    .replace('Poor', '')
    .trim().split(' ')[0].trim().toLowerCase()
  var eventRaw = info.querySelector('event').textContent.toLowerCase()


  // Check available languages
  languages = []
  for (var ie = 0; ie < infos.length; ie++) {
    if (infos[ie].querySelector('language').textContent == selectedLANGUAGE) { info = infos[ie] }
    languages.push(infos[ie].querySelector('language').textContent)
  }
  debug('Languages: ' + languages)

  // Use CAP field onset if available (f.eg. SmartAlert)
  // Otherwise use CAP field effective (f.eg. NOAA)
  if (info.querySelector('onset')) {
    var fromDate = new Date(info.querySelector('onset').textContent)
    var fromDateISO = info.querySelector('onset').textContent
  } else if (info.querySelector('effective')) {
    var fromDate = new Date(info.querySelector('effective').textContent)
    var fromDateISO = info.querySelector('effective').textContent
  }

  var toDate = new Date(info.querySelector('expires').textContent)
  var dnow = new Date()

  if (!toDate.isAfterDay(0)) { return }

  events.push(eventSelector)

  debug('Event: ' + events)
  debug('Area Description: ' + area)
  debug('Number of polygons: ' + areapolygons.length)

  for (var v = 0; v < parameters.length; v++) {
    if (parameters[v].querySelector('valueName').textContent == 'WindSpeed') { windSpeed = Math.round(parameters[v].querySelector('value').textContent) }
    if (parameters[v].querySelector('valueName').textContent == 'WindDirection') { windDirection = Math.round(parameters[v].querySelector('value').textContent) }
    if (parameters[v].querySelector('valueName').textContent == 'WaveHeight') { waveHeight = Math.round(parameters[v].querySelector('value').textContent) }
    if (parameters[v].querySelector('valueName').textContent == 'SwellHeight') { swellHeight = Math.round(parameters[v].querySelector('value').textContent) }
    if (parameters[v].querySelector('valueName').textContent == 'SurfHeight') { surfHeight = Math.round(parameters[v].querySelector('value').textContent) }
    debug(parameters[v].querySelector('valueName').textContent)
    debug(parameters[v].querySelector('value').textContent)
  }

  for (p = 0; p < areapolygons.length; p++) {
    var color
    var zindex
    var opacity
    var latLngs = areapolygons[p].textContent.split(' ')

    // create polygon
    var i; var latLng; var path = []

    for (i = 0; i < latLngs.length - 1; i++) {
      var latLng = latLngs[i].split(',')
      path.push(new L.LatLng(parseFloat(latLng[0]), parseFloat(latLng[1])))
    }

    switch (severity) {
      case 'Extreme':
        // Red
        color = '#FF0000'
        strokeColor = '#cc0000'
        zindex = 4
        opacity = 1
        break
      case 'Severe':
        // Orange
        color = '#FFA500'
        strokeColor = '#ba7901'
        zindex = 3
        opacity = 1
        break
      case 'Moderate':
        // Yellow
        color = '#FFFF00'
        strokeColor = '#afaf01'
        zindex = 2
        opacity = 1
        break
      case 'Minor':
        // Green
        color = '#00FF00'
        strokeColor = '#01a801'
        zindex = 1
        opacity = 1
        break
      default:
        color = '#FFFFFF'
        strokeColor = '#bcbcbc'
        opacity = 1
    }

    var areapolygon = L.polygon(path, {
      pane: severity,
      paths: path,
      fillColor: color,
      fillOpacity: 1,
      color: '#000000',
      opacity: alertOptions.polygonOptions.strokeOpacity,
      weight: alertOptions.polygonOptions.strokeWeight,
      map: map,
      visible: false,
      fromDate: fromDateISO,
      toDate: info.querySelector('expires').textContent,
      capEvent: eventRaw,
      // polygonArea: google.maps.geometry.spherical.computeArea(path),
      polygonArea: polygonArea(path),
      zIndex: zindex
    })

    // add polygons to a polygongroup
    areapolygon.addTo(mapPolygons)
    mapPolygons.addTo(map)

    polygons.push(areapolygon)
    var bounds = areapolygon.getBounds()

    var markerLocation = bounds.getCenter()
    var test = parseFloat(markerLocation['lat']).toFixed(4) + ' ' + parseFloat(markerLocation['lng']).toFixed(4)

    var value = coordinatesExist(markerLocations, test)
    if (alertOptions.polygonOptions.preventSymbolOverlapping === true) {
      xDisplacement = (alertOptions.iconWidth + 5) * value
    } else {
      xDisplacement = 0
    }
    markerLocations.push(test)

    var symbolPath = 'img/'
    if (alertOptions.transparentIcons === true && alertOptions.customIcons === false)
      var symbolPath = 'img/transparent/'
    if (alertOptions.customIcons === true)
      var symbolPath = 'img/custom/'
    if (alertOptions.transparentIcons === true && alertOptions.customIcons === true)
      var symbolPath = 'img/custom/transparent/'

    function createIcon(symbolPath, alertOptions, eventRaw, windSpeed, windDirection, waveHeight, swellHeight, surfHeight, eventSelector) {
      // Set default icon
      let iconUrl = symbolPath + 'gale.png';  // Fallback icon
      let iconSize = [alertOptions.iconWidth, alertOptions.iconHeight];
      let iconAnchor = [alertOptions.iconWidth / 2 + alertOptions.xDisplacement || 0, alertOptions.iconWidth / 2];
      let popupAnchor = [0, 0];

      // Determine icon URL based on conditions
      if (windSpeed > 0) {
        iconUrl = alertOptions.numberIcons
          ? `${symbolPath}wind.php?speed=${windSpeed}&direction=${windDirection}`
          : symbolPath + 'wind-speed.png';
      } else if (waveHeight > 0) {
        iconUrl = alertOptions.numberIcons
          ? `${symbolPath}wave.php?height=${waveHeight}`
          : symbolPath + 'wave-height.png';
      } else if (swellHeight > 0) {
        iconUrl = alertOptions.numberIcons
          ? `${symbolPath}wave.php?height=${swellHeight}`
          : symbolPath + 'swell-height.png';
      } else if (surfHeight > 0) {
        iconUrl = alertOptions.numberIcons
          ? `${symbolPath}wave.php?height=${surfHeight}`
          : symbolPath + 'surf-height.png';
      } else {
        // Handle events based on eventRaw or eventSelector
        let eventMapping = [
          { match: 'earthquake', icon: 'earthquake.png' },
          { match: 'fire', icon: 'fire.png' },
          { match: 'drought', icon: 'drought.png' },
          { match: 'craft', icon: 'smallcraft.png' },
          { match: 'wave', icon: 'wave-height.png' },
          { match: 'dust', icon: 'dust.png' },
          { match: 'gale', icon: 'gale.png' },
          { match: 'fog', icon: 'fog.png' },
          { match: 'frost', icon: 'frost.png' },
          { match: 'heat', icon: 'temperature.png' },
          { match: 'cold', icon: 'cold.png' },
          { match: 'snow', icon: 'snow.png' },
          { match: 'rain', icon: 'rainfall.png' },
          { match: 'shower', icon: 'rainfall.png' },
          { match: 'icing', icon: 'snow.png' },
          { match: 'sleet', icon: 'sleet.png' },
          { match: 'wet snow', icon: 'snow.png' },
          { match: 'wind', icon: 'wind.png' },
          { match: 'tsunami', icon: 'tsunami.png' },
          { match: 'tornado', icon: 'tornado.png' },
          { match: 'waterspout', icon: 'waterspout.png' },
          { match: 'volcanic', icon: 'volcano.png' },
          { match: 'thunderstorm', icon: 'thunderstorm.png' },
          { match: 'lightning', icon: 'thunderstorm.png' },
          { match: 'hail', icon: 'hail.png' },
          { match: 'hurricane', icon: 'tropical-hurricane.png' },
          { match: 'super', icon: 'supertyphoon.png' },
          { match: 'typhoon', icon: 'typhoon.png' },
          { match: 'tropical storm', icon: 'tropical-storm.png' },
          { match: 'severe tropical storm', icon: 'severe-tropical-storm.png' },
          { match: 'visibility', icon: 'fog.png' },
          { match: 'depression', icon: 'tropical-depression.png' },
          { match: 'tropical', icon: 'cyclone.png' },
          { match: 'landslide', icon: 'landslide.png' },
          { match: 'high temperature', icon: 'high-temperature.png' },
          { match: 'low temperature', icon: 'low-temperature.png' },
          { match: 'storm surge', icon: 'flood.png' },
          { match: 'high river level', icon: 'high-river-level.png' },
          { match: 'low river level', icon: 'low-river-level.png' },
          { match: 'river flood', icon: 'river-flood.png' },
          { match: 'flash flood reservoir', icon: 'flash-flood-reservoir.png' },
          { match: 'flash flood probability', icon: 'flash-flood-probability.png' },
          { match: 'flash flood', icon: 'flash-flood.png' },
          { match: 'flood', icon: 'flood.png' },
          { match: 'disturbance', icon: 'disturbance.png' },
          { match: 'high tide', icon: 'high-tide.png' },
        ];

        for (let event of eventMapping) {
          if (eventRaw.includes(event.match)) {
            iconUrl = symbolPath + event.icon;
            break;
          }
        }
      }

      // Create the icon using Leaflet's L.icon
      return L.icon({
        iconUrl: iconUrl,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
        popupAnchor: popupAnchor
      });
    }

    const icon = createIcon(symbolPath, alertOptions, eventRaw, windSpeed, windDirection, waveHeight, swellHeight, surfHeight, eventSelector);

    var marker
    if (icon != null) {
      // create a marker for polygon
      marker = L.marker(markerLocation,
        {
          icon: icon,
          visible: false,
          icon: icon,
          fromDate: fromDateISO,
          toDate: info.querySelector('expires').textContent,
          capEvent: eventRaw,
        })
      marker.addTo(mapMarkers)
      mapMarkers.addTo(map)
    } else {
      marker = L.marker(markerLocation, { icon: null })
      marker.addTo(mapMarkers)
      mapMarkers.addTo(map)
    }

    // create an infowindow
    var sender
    if (info.querySelector('senderName')) { sender = info.querySelector('senderName').textContent } else { sender = alert.querySelector('sender').textContent }

    if (alert.querySelector('web')) { sender = '<a href="http://' + dom.querySelector('web').textContent + '">' + sender + '</a>' }

    $('#senderName').html(sender)


    if (dnow.getTime() > fromDate.getTime() && alertOptions.displayActiveFor) {
      var active_str = '<i>' + t('Active for next') + ' <b>' + toDate.dateDiff() + '</b></i>'
    } else {
      var active_str = ''
    }

    var sentDate = alert.querySelector('sent').textContent.toLocaleString()
    var fromDateFormatted = fromDate.toLocaleString()
    var toDateFormatted = toDate.toLocaleString()
    var dFormatted = d.toLocaleString()

    if (alertOptions.dateFormat === 'long') {

      var formatter = getFormatter()

      var lang = selectedLANGUAGE.split('-')[0]
      if (alertOptions.customLangCode !== undefined) {
        for (var h = 0; h < Object.keys(alertOptions.customLangCode).length; h++) {
          if (selectedLANGUAGE === Object.keys(alertOptions.customLangCode)[h]) {
            lang = alertOptions.customLangCode[selectedLANGUAGE]
          }
        }
      }
      if (lang === 'om' || lang === 'am') {
        sentDate = toEthiopianCalendar(sentDate)
        fromDateFormatted = toEthiopianCalendar(fromDateFormatted)
        toDateFormatted = toEthiopianCalendar(toDateFormatted)
        dFormatted = toEthiopianCalendar(dFormatted)

      } else {
        sentDate = dayjs(sentDate).locale(lang).format(formatter)
        fromDateFormatted = dayjs(fromDate).locale(lang).format(formatter)
        toDateFormatted = dayjs(toDate).locale(lang).format(formatter)
        dFormatted = dayjs(d).locale(lang).format(formatter)
      }
    }


    // var infowindow = new google.maps.InfoWindow({
    var content = '<h4 class="iw-title">' + info.querySelector('event').textContent + '</h4>' +
      '<i>' + t('Valid from') + ' <b>' + fromDateFormatted + '</b> ' + t('to') + ' <b>' + toDateFormatted + '</b></i>' +
      active_str +
      '<p>' + (info.querySelector('description') ? info.querySelector('description').textContent : '') + '</p>' +
      '<p><i>' + t('Issued by') + ' ' + sender +
      ' ' + t('at') + ' ' + dFormatted

    if (!!alertOptions.displayIssueTimeDirrefence || alertOptions.displayIssueTimeDirrefence === undefined)
      content = content + ' (' + d.dateDiff() + ')</i></p>'



    // bind markers to marker and polygon
    var popup = L.popup({
      maxWidth: 220,
      minWidth: 220,
      maxHeight: alertOptions.popUpMaxHeight,
      autoPan: true,
      autoPanPadding: [2, 2]
    });

    popup.setContent(content)
    marker.bindPopup(popup).addTo(map)
    areapolygon.bindPopup(popup).addTo(map)
    markers.push(marker)
  }
  showMarkers(selectedDAY)
  showPolygons(selectedDAY)
  debug(events)
};

const getFormatter = () => {
  if (alertOptions.dateFormatString[selectedLANGUAGE] !== undefined) {
    return alertOptions.dateFormatString[selectedLANGUAGE];
  } else if (alertOptions.dateFormatString['default'] !== undefined) {
    return alertOptions.dateFormatString['default'];
  } else {
    return alertOptions.dateFormatString;
  }
}

// http://www.mathopenref.com/coordpolygonarea2.html
function polygonArea(path) {
  var numPoints = path.length
  var X = []
  var Y = []

  for (var i = 0; i < numPoints; i++) {
    X.push(path[i].lat)
    Y.push(path[i].lng)
  }
  var area = 0 // Accumulates area in the loop
  var j = numPoints - 1 // The last vertex is the 'previous' one to the first
  for (var i = 0; i < numPoints; i++) {
    area = area + (X[j] + X[i]) * (Y[j] - Y[i])
    j = i // j is previous vertex to i
  }
  return Math.abs(area / 2)
}

function coordinatesExist(array, value) {
  var k = 0
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      k = k + 1
    }
  }
  return k
}

function isMarkerInsidePolygon(point, poly) {
  var polyPoints = poly.getLatLngs();
  var x = point.x, y = point.y;

  var inside = false;
  for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
    var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
    var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// centroid of a non-self-intersecting closed polygon
// https://en.wikipedia.org/wiki/Centroid#Centroid_of_polygon
// https://stackoverflow.com/questions/22796520/finding-the-center-of-leaflet-polygon
function getCentroid2(arr) {

  arr = arr[0]

  var twoTimesSignedArea = 0;
  var cxTimes6SignedArea = 0;
  var cyTimes6SignedArea = 0;

  var length = arr.length

  // var x = function (i) { return arr[i % length][0] };
  // var y = function (i) { return arr[i % length][1] };

  var x = function (i) { return arr[i % length].lat };
  var y = function (i) { return arr[i % length].lng };

  for (var i = 0; i < arr.length; i++) {
    var twoSA = x(i) * y(i + 1) - x(i + 1) * y(i);
    twoTimesSignedArea += twoSA;
    cxTimes6SignedArea += (x(i) + x(i + 1)) * twoSA;
    cyTimes6SignedArea += (y(i) + y(i + 1)) * twoSA;
  }
  var sixSignedArea = 3 * twoTimesSignedArea;
  return [cxTimes6SignedArea / sixSignedArea, cyTimes6SignedArea / sixSignedArea];
}


const initIconLegendButton = () => {
  const button = document.getElementById('icon-legend-button')
  button.innerHTML = '&#8505'

  let visible = true
  button.addEventListener('click', function () {
    if (visible) {
      document.getElementById('icon-legend-container').style.visibility = 'hidden'
      visible = false
    }
    else if (!visible) {
      document.getElementById('icon-legend-container').style.visibility = 'visible'
      visible = true
    }
  })
}

const toEthiopianCalendar = (date) => {
  const time = (dayjs(date).format("hh:mm"))
  date = dayjs(date).locale(lang).format("YYYY/MM/DD").split('/')
  const ethiopianDate = toEthiopian(date)
  const result = ethiopianDate[2] + '/' + ethiopianDate[1] + '/' + ethiopianDate[0] + ', ' + time
  return result
}

function convertUtcToLocal(utcTimeString) {
  // Create a Dayjs object in UTC from the string
  const utcDate = dayjs.utc(utcTimeString, 'YYYYMMDDHHmmss')

  // Get today's date in the specified time zone
  const today = dayjs().tz(alertOptions.timeZone)
  const todayOffset = today.utcOffset() // Today's offset in minutes

  // Convert the given date to local time using dayjs with the specified time zone
  const localDate = utcDate.tz(alertOptions.timeZone)
  const localTimeOffset = localDate.utcOffset() // Local date offset in minutes

  // Adjust the local date time and offset to match today's offset
  const offsetDifference = todayOffset - localTimeOffset
  const adjustedLocalDate = localDate.add(offsetDifference, 'minute')

  let adjustedLocalTimeString

  // Check if dateFormatString is an object with different formats for different languages
  const dateFormat = typeof alertOptions.dateFormatString === 'object'
    ? alertOptions.dateFormatString[selectedLANGUAGE]
    : alertOptions.dateFormatString;

  adjustedLocalTimeString = adjustedLocalDate.format(dateFormat);

  // Get the new UTC offset for the adjusted date in hours and minutes
  const offsetHours = Math.floor(todayOffset / 60)
  const offsetMinutes = todayOffset % 60
  const utcOffset = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}:${offsetMinutes.toString().padStart(2, '0')}`

  // Format the final string with the new UTC offset
  const result = alertOptions.hideOffset ? `${adjustedLocalTimeString}` : `${adjustedLocalTimeString} (${utcOffset})`;

  return result
}