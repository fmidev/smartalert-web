# SmartAlert CAP Web

All customizations are to be done to capmap-config.js and index.html files.

## Initial set up

1. edit capmap-config.js 
  * set default language
  * specify initial map position and zoom level
  * specify which day buttons will be shown
  * add event types for the dropdown menu, c
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
| `useLocation`         | `Boolaen` | `false`         | Allow user location. |
| `useMinorThreat`      | `Boolean` | `false`         | Display minor threat level warning. |
| `defaultLanguage`     | `String`  | `'en-US'`       | Choose the defaylt language. |
| `dateFormat`          | `String`  | `'ISOString'`   | Use longer date format. Available options are `long` and (default) `ISOString`. |
| `dateFormatString`    | `String`  | `null`        | Define the date format used in warning popups if `dateFormat:long`. It's also possible to define date formats for each used language; `'default': 'MMMM Do YYYY, HH:mm'`, `'vi-VN': 'HH [giờ] mm [phút], [ngày] DD/MM/YYYY'`, `'en-VN': 'MMMM Do YYYY, HH:mm'`. |
| `mapTileSource`       | `String`  | `''` | Map tile source. See examples from here: https://leaflet-extras.github.io/leaflet-providers/preview/ |
| `zoom`                | `Number`  | `7`             | Default map zoom level. |
| `attribution`         | `String`  | `null`          | Attribution text/link. |
| `displayWMS`          | `Boolean` | `null`          | Display additional content (country borders, regions etc.) as a WMS layer. |
| `displayOptions`      | `Object`  | `null`          | Settings passed to Tilelayer.WMS. Documentation: https://leafletjs.com/reference.html#tilelayer-wms-l-tilelayer-wms
| `displayOptions.endpoint`   | `Object`  | `null`    | WMS server endpoint. E.g.: https://openwms.fmi.fi/geoserver/wms
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
| `allDayControl`       | `Boolean` | `true`          | Display All days butto.  |
| `popUpMaxHeight`      | `Number`  | `false`         | Warning popup maximum height in pixels. |
| `refresh`             | `Number`  | `300`           | Warning refresh interval in seconds. |
| `areaLimitForMarkers` | `Number`  | `0.005`         | Minmum area for warning symbols to be displayed. |
| `iconWidth`           | `Number`  | `30`            | Warning icon width in pixels. |
| `iconHeight`          | `Number`  | `30`            | Warning icon height in pixels. |
| `transparentIcons`    | `Boolean` | `false`         | Use transparent icons. |
| `eventTypes`          | `Object`  | `{}`            | List of used events, key is unique word appearing in event tag. |