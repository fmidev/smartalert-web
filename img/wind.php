<?php
#
# 2015 Mikko Rauhala <mikko@rauhala.net>
#

$speed = $_REQUEST["speed"];
$direction = $_REQUEST["direction"];

$paths = array("M28.13 53.88L40 59.82l11.87-5.94L40 77.62z","M21.79 41.42l4.2 12.59 12.59 4.2L13.4 66.6z","M26.12 28.13L20.18 40l5.94 11.87L2.37 40z","M38.58 21.79l-12.59 4.2-4.2 12.59L13.4 13.4z","M51.87 26.12L40 20.18l-11.87 5.94L40 2.37z","M58.21 38.58l-4.2-12.59-12.59-4.2L66.6 13.4z","M53.88 51.87L59.82 40l-5.94-11.87L77.62 40z","M41.42 58.21l12.59-4.2 4.2-12.59L66.6 66.6z","M28.13 53.88L40 59.82l11.87-5.94L40 77.62z");

$path = $paths[floor(($direction+22.5)/45)];

$fontsize = $speed > 99 ? 14 : 20;

header("Content-type: image/svg+xml");
print <<<EOT
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linejoin="round" stroke-miterlimit="10" cx="40" cy="40" r="19.32"/><path fill="#000000" d="$path"/><text x="26" y="47" fill="black" font-family="Verdana" 
        font-size="$fontsize" font-weight="bold">$speed</text></svg>
EOT;
