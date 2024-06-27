# SmartAlert CAP Web

All customizations are to be done to capmap-config.js, index.html and capfeed.php files.

## Initial set up

1. edit capmap-config.js 
  * set default language
  * specify initial map position and zoom level
  * specify which day buttons will be shown
  * add event types for the dropdown menu (events can also be combined as a comam separated list, i,e. `"rain,showers" : "Rain warnings"`)
  * add map bounds
  * add your google analytics id

2. edit index.html
  * load relevant language files

3. make or edit i18n/translations-xx-xx.js file
  * create one, if missing
  * make sure that there is translations for event types that you
    added to capmap-config.js

4. make symbolic link to smartalert data directory
  * ln -s /smartmet/editor/smartalert data

5. if multiple data sources are used remember to configure these in capfeed.php. See `subDirectories` option below.

## Local development
Run application
```
php -S localhost:8080
```
and navigate to `http://localhost:8080``

## Application configuration
capmap-config.js configuration options:

### Mandatory options
Fill in these values at initial se up

| Option                | Type |  Default         | Description
| --------------------- | ---- | ---------------- | ------------------------------------------- |
| `center`              | `Array`   | `null`          | Default map center point in `[latitude, longitude]`. |
| `bounds.north`        | `Number`  | `null`          | Default northern map boundary. |
| `bounds.east`         | `Number`  | `null`          | Default eastern map boundary. |
| `bounds.south`        | `Number`  | `null`          | Default southern map boundary. |
| `bounds.west`         | `Number`  | `null`          | Default western map boundary. |

### Other options
| Option                | Type |  Default         | Description
| --------------------- | ---- | ---------------- | ------------------------------------------- |
| `subDirectories`      | `String`  | `''`  | A comma separated list of data source subdirectories. E.g. 'meteorology,hydrology'. By default data/ is used. |
| `useLocation`         | `Boolean` | `false`         | Allow user location. |
| `useMinorThreat`      | `Boolean` | `false`         | Display minor threat level warning. |
| `defaultLanguage`     | `String`  | `'en-US'`       | Choose the defaylt language. |
| `customLangCode`     | `Object`  | `'null'`       | Choose a custom language code for date formatting, day.js doesn't always use ISO standard language codes. I.e. `customLangCode: {'ua-UA':'uk'}` |
| `dateFormat`          | `String`  | `'ISOString'`   | Use longer date format. Available options are `long` and (default) `ISOString`. |
| `dateFormatString`    | `Object`  | `null`        | Define the date format used in warning popups if `dateFormat:long`. It's also possible to define date formats. For example:<pre>dateFormatString: {<br>  "default": "MMMM Do YYYY, HH:mm",<br>  'vi-VN': 'HH [giá»] mm [phÃºt], [ngÃ y] DD/MM/YYYY', <br>  "en-VN": "MMMM Do YYYY, HH:mm"<br>},</pre>
| `displayIssueTimeDirrefence`    | `Boolean`  | `true`        | Display time difference to time of issue (i.e. Issued by Ukrainian Hydrometeorological Center at 29.11.2022, 13:28 (10 days 22 hours 11 minutes ago)) |
| `mapTileSource`       | `String`  | `''` | Map tile source. See examples from here: https://leaflet-extras.github.io/leaflet-providers/preview/ |
| `zoom`                | `Number`  | `7`             | Default map zoom level. |
| `attribution`         | `String`  | `null`          | Attribution text/link. |
| `displayWMS`          | `Boolean` | `null`          | Display additional content (country borders, regions etc.) as a WMS layer. |
| `displayOptions`      | `Object`  | `null`          | Settings passed to Tilelayer.WMS. Documentation: https://leafletjs.com/reference.html#tilelayer-wms-l-tilelayer-wms
| `displayOptions.endpoint`   | `String`  | `null`    | WMS server endpoint. E.g.: https://openwms.fmi.fi/geoserver/wms
| `displayOptions.params`     | `String`  | `null`    | Required query parameters. If any custom options not documented here are used, they will be sent to the WMS server as extra parameters in each request URL. This can be useful for non-standard vendor WMS parameters. E.g. {layers:'nexrad-n0r-900913', format:'image/png', transparent:true} 
| `polygonOptions.fillOpaity`    | `Number` | `0.2`   | Warning polygon fill opacity in pixels. |
| `polygonOptions.strokeOpacity` | `Number` | `1`     | Warning polygon stroke opacity in pixels.  |
| `polygonOptions.strokeWeight`  | `Number` | `3`     | Warning polygon stroke wight in pixels. |
| `dayControl`          | `Boolean` | `true`          | Display day control buttons. |
| `day0Control`         | `Boolean` | `true`          | Display Day 1 button. |
| `day1Control`         | `Boolean` | `true`          | Display Day 2 button.  |
| `day2Control`         | `Boolean` | `true`          | Display Day 3 button.  |
| `day4Control`         | `Boolean` | `true`          | Display Day 4 button.  |
| `day4Control`         | `Boolean` | `true`          | Display Day 5 button.  |
| `allDayControl`       | `Boolean` | `true`          | Display All days button.  |
| `extendedDayControl`  | `Boolean` | `false`         | Display extended day selection buttons that include weekday, date and color of the highest warning of the that day. |
| `dayDateFormat`       | `String`  | `DD.MM`         | Date displayed on day selection buttons if extendedDayControl is true |
| `popUpMaxHeight`      | `Number`  | `false`         | Warning popup maximum height in pixels. |
| `refresh`             | `Number`  | `300`           | Warning refresh interval in seconds. |
| `areaLimitForMarkers` | `Number`  | `0.005`         | Minmum area for warning symbols to be displayed. |
| `iconWidth`           | `Number`  | `30`            | Warning icon width in pixels. |
| `iconHeight`          | `Number`  | `30`            | Warning icon height in pixels. |
| `transparentIcons`    | `Boolean` | `false`         | Use transparent icons. |
| `customIcons`         | `Boolean` | `false`         | Use custom icons. Requires copying contents of /img/ to /img/custom including the transparent folder. Images in custom folder can then be replaced. |
| `customLocations`     | `Boolean` | `false`         | Use configurable custom locations. Custom locations need to be added to locations.js file.  |
| `numberIcons`         | `Boolean` | `false`         | Display the numeric value instead of icon for wave height, wind speed, swell height and surf height.  |
| `showIconLegend`      | `Boolean` | `false`         | Display legend that tells meaning of active markers. |
| `ShowUpdateTime`      | `Boolean` | `false`         | Display latest update time on legend |
| `eventTypes`          | `Object`  | `{}`            | List of used events, key is unique word appearing in event tag. Use comma separated keys to combine multiple warning events to be displayed with one selection in the dropdown list, i.e.: `"shower,rain": "Rain",` |
