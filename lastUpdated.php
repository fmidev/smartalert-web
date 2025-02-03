<?php

// Base directory paths
$basePaths = [
    "data/published",
    "data/hydrology/published",
    "data/meteorology/published"
    
];

$latestDirName = null;
$latestTimestamp = 0;

foreach ($basePaths as $basePath) {
    // Find the latest year directory
    $latestYearDir = trim(`find $basePath -mindepth 1 -maxdepth 1 -type d | sort -nr | head -1`);

    if ($latestYearDir) {
        // Find the latest month directory within the latest year directory
        $latestMonthDir = trim(`find $latestYearDir -mindepth 1 -maxdepth 1 -type d | sort -nr | head -1`);

        if ($latestMonthDir) {
            // Find the latest folder within the latest month directory
            $latestFolderDir = trim(`find $latestMonthDir -mindepth 1 -maxdepth 1 -type d | sort -nr | head -1`);

            if ($latestFolderDir) {
                // Get the modification time of the latest folder
                $folderTimestamp = filemtime($latestFolderDir);

                // **Ensure global comparison is performed correctly**
                if ($folderTimestamp > $latestTimestamp) {
                    $latestTimestamp = $folderTimestamp;
                    $latestDirName = basename($latestFolderDir);
                }
            }
        }
    }
}

header("Content-type: application/json");
header("Pragma: no-cache");
header("Cache-control: no-cache, must-revalidate");
header("Expires: Fri, 01 Jan 1990 00:00:00 GMT");
echo json_encode($latestDirName);

?>
