<?php

$capfiles = [];
$basePath = __DIR__ . "/data";

$DIRS = filter_input(INPUT_GET, 'dir');

if (!$DIRS) {
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
  // Validate user-supplied dir against a strict whitelist (prevents path traversal)
  $SUBDIRS = [];
  foreach (explode(',', $DIRS) as $d) {
    $d = trim($d);
    if ($d === "" || !preg_match('/^[A-Za-z0-9_-]+$/', $d)) continue;
    if (!is_dir("$basePath/$d/publishedCap")) continue;
    $SUBDIRS[] = $d;
  }
}

function findLatestCapDir(string $root): ?string {
  if (!is_dir($root)) return null;
  $latest = $root;
  $it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
  );
  foreach ($it as $fileInfo) {
    if ($fileInfo->isDir()) {
      $path = $fileInfo->getPathname();
      if (strcmp($path, $latest) > 0) $latest = $path;
    }
  }
  return $latest;
}

foreach ($SUBDIRS as $DIR) {
  $relRoot = $DIR === "" ? "data/publishedCap" : "data/$DIR/publishedCap";
  $absLatest = findLatestCapDir(__DIR__ . "/" . $relRoot);
  if ($absLatest === null) continue;

  // Keep the response paths relative to the document root, but do all
  // filesystem reads against the absolute path (independent of the PHP CWD).
  $relLatest = substr($absLatest, strlen(__DIR__) + 1);

  foreach (scandir($absLatest) as $file) {
    if (preg_match("/_ALERT_/", $file) || preg_match("/_UPDATE_/", $file)) {
      $capfiles[] = $relLatest . "/" . $file;
    }
  }
}

header("Content-type: application/json");
header("Pragma: no-cache");
header("Cache-control: no-cache, must-revalidate");
header("Expires: Fri, 01 Jan 1990 00:00:00 GMT");
print json_encode($capfiles);
