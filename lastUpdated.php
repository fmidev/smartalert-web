<?php

require_once __DIR__ . "/capsite.php";

// Base directory paths (absolute, independent of the PHP working directory).
// publishedCap carries the same timestamp directories as published, so the
// update time is also found when only the CAP files are present.
$siteDir = capSiteDir();
$basePaths = [
    $siteDir . "/data/published",
    $siteDir . "/data/hydrology/published",
    $siteDir . "/data/meteorology/published",
    $siteDir . "/data/publishedCap",
    $siteDir . "/data/hydrology/publishedCap",
    $siteDir . "/data/meteorology/publishedCap",
];

// Return the lexicographically greatest immediate subdirectory name, or null.
// For zero-padded timestamp names (YYYY, MM, YYYYMMDDHHmmss) this is the latest.
function latestSubdir($dir) {
    if (!is_dir($dir)) return null;
    $best = null;
    foreach (scandir($dir) as $entry) {
        if ($entry[0] === ".") continue;
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

    // Cross-path comparison: keep the folder with the most recent modification
    // time, and on a tie the later timestamp name -- published and publishedCap
    // are written in the same second.
    $folderTimestamp = filemtime($folderPath);
    if ($folderTimestamp > $latestTimestamp
        || ($folderTimestamp === $latestTimestamp && strcmp($latestFolder, (string) $latestDirName) > 0)) {
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
