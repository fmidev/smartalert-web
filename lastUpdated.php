<?php

require_once __DIR__ . "/capsite.php";

// Base directory paths (absolute, independent of the PHP working directory)
$siteDir = capSiteDir();
$basePaths = [
    $siteDir . "/data/published",
    $siteDir . "/data/hydrology/published",
    $siteDir . "/data/meteorology/published",
];

// Return the lexicographically greatest immediate subdirectory name, or null.
// For zero-padded timestamp names (YYYY, MM, YYYYMMDDHHmmss) this is the latest.
function latestSubdir($dir) {
    if (!is_dir($dir)) return null;
    $best = null;
    foreach (scandir($dir) as $entry) {
        if ($entry === "." || $entry === "..") continue;
        if (!is_dir($dir . "/" . $entry)) continue;
        if ($best === null || strcmp($entry, $best) > 0) $best = $entry;
    }
    return $best;
}

$latestDirName = null;
$latestTimestamp = 0;

foreach ($basePaths as $basePath) {
    // Find the latest year -> month -> folder using PHP-native directory scanning
    $latestYear = latestSubdir($basePath);
    if ($latestYear === null) continue;

    $latestMonth = latestSubdir($basePath . "/" . $latestYear);
    if ($latestMonth === null) continue;

    $latestFolder = latestSubdir($basePath . "/" . $latestYear . "/" . $latestMonth);
    if ($latestFolder === null) continue;

    $folderPath = $basePath . "/" . $latestYear . "/" . $latestMonth . "/" . $latestFolder;

    // Cross-path comparison: keep the folder with the most recent modification time
    $folderTimestamp = filemtime($folderPath);
    if ($folderTimestamp > $latestTimestamp) {
        $latestTimestamp = $folderTimestamp;
        $latestDirName = $latestFolder;
    }
}

header("Content-type: application/json");
header("Pragma: no-cache");
header("Cache-control: no-cache, must-revalidate");
header("Expires: Fri, 01 Jan 1990 00:00:00 GMT");
echo json_encode($latestDirName);

?>
