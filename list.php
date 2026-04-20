<?php

$capfiles = [];

$DIRS = filter_input(INPUT_GET, 'dir', FILTER_SANITIZE_SPECIAL_CHARS);

if (!$DIRS) {
  $basePath = __DIR__ . "/data";
  $SUBDIRS = [];
  if (is_dir("$basePath/publishedCap")) {
    // If "data/publishedCap" exists, just use that
    $SUBDIRS[] = "";
  } else {
    // Otherwise, auto-discover subdirectories under "data/" containing "publishedCap"
    foreach (scandir($basePath) as $d) {
      if ($d === "." || $d === "..") continue;
      if (is_dir("$basePath/$d/publishedCap")) {
        $SUBDIRS[] = $d;
      }
    }
  }
} else {
  $SUBDIRS = explode(',', $DIRS);
}

foreach ($SUBDIRS as $DIR) {
  $DIR = trim(`find data/$DIR/publishedCap -type d|sort -n|tail -1`);
  if (!$DIR || !is_dir($DIR)) continue;

  $FILES = scandir($DIR);
  foreach ($FILES as $file) {
    if (preg_match("/_ALERT_/", $file) || preg_match("/_UPDATE_/", $file)) {
      $capfiles[] = $DIR . "/" . $file;
    }
  }
}

header("Content-type: application/json");
header("Pragma: no-cache");
header("Cache-control: no-cache, must-revalidate");
header("Expires: Fri, 01 Jan 1990 00:00:00 GMT");
print json_encode($capfiles);
