<?php

// Enable to signal maintenance mode for the poller (boolean, optional)
$SERVER_IN_MAINTENANCE = false;

// Sends a 'Retry-After' HTTP response header if specified (int, optional, defaults to none)
$RETRY_AFTER_INTERVAL_IN_SECONDS = 5;

// The per-country CAP data volumes are deliberately not listed as required
// mount points: a site with no data mounted still serves its map, and requiring
// them here would keep the pod out of the load balancer until every country's
// network share exists. Add '/smartmet/www/smartalert/<cc>/data' entries once
// the shares are provisioned and expected to stay up.

// Message body for successful health check responses (string, optional)
$VALID_CHECK_RESPONSE_BODY = 'OK';

require_once 'generate-monitor-response.php';
