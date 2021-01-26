# SmartAlert CAP Web

All customizations are to be done to capmap-config.js and index.html files.

1. edit capmap-config.js 
  * set default language
  * specify initial map position and zoom level
  * specify which day buttons will be shown
  * add event types for the dropdown menu, key is unique word appearing in event tag
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

