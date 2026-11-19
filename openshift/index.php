<?php

// Landing page. Countries are discovered from the mounted share at runtime, so
// adding one is a matter of creating a directory there -- no rebuild.

$names = [
    'az' => 'Azerbaijan', 'co' => 'Colombia', 'et' => 'Ethiopia',
    'ge' => 'Georgia', 'jm' => 'Jamaica', 'ke' => 'Kenya',
    'kg' => 'Kyrgyzstan', 'rw' => 'Rwanda', 'tj' => 'Tajikistan',
    'tz' => 'Tanzania', 'ua' => 'Ukraine', 'ua-sea' => 'Ukraine (marine)',
    'ug' => 'Uganda', 'uz' => 'Uzbekistan', 'vn' => 'Vietnam',
];

$sites = [];
foreach (glob(__DIR__ . '/sites/*/capmap-config.js') as $config) {
    $code = basename(dirname($config));
    if (!preg_match('/^[a-z]{2}(-[a-z]+)?$/', $code)) continue;

    $name = isset($names[$code]) ? $names[$code] : strtoupper($code);
    $source = @file_get_contents($config, false, null, 0, 65536);
    if ($source !== false && preg_match('/siteName\s*:\s*[\'"]([^\'"]{1,60})[\'"]/', $source, $m)) {
        $name = $m[1];
    }
    $sites[$code] = $name;
}
ksort($sites);

function e($value)
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

?><!DOCTYPE HTML>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SmartAlert</title>
<link rel="apple-touch-icon" href="cap-logo.png">
<style>
body{font-family:system-ui,sans-serif;margin:0;padding:2rem;background:#f4f5f7;color:#1c1e21}
h1{font-size:1.4rem;font-weight:600;margin:0 0 1.5rem}
ul{list-style:none;margin:0;padding:0;display:grid;gap:.5rem;
grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));max-width:60rem}
a{display:block;padding:.9rem 1rem;background:#fff;border:1px solid #dcdfe4;
border-radius:6px;text-decoration:none;color:#1c1e21}
a:hover{border-color:#303193;box-shadow:0 1px 4px rgba(0,0,0,.12)}
code{color:#6b7078;font-size:.85em}
p.empty{max-width:40rem;color:#6b7078;line-height:1.5}
</style>
</head>
<body>
<h1>SmartAlert</h1>
<?php if (!$sites): ?>
<p class="empty">No country sites found. Each country is a directory on the
mounted share containing <code>capmap-config.js</code>; the site appears here as
soon as one exists.</p>
<?php else: ?>
<ul>
<?php foreach ($sites as $code => $name): ?>
<li><a href="<?php echo e($code); ?>/"><?php echo e($name); ?> <code>/<?php echo e($code); ?>/</code></a></li>
<?php endforeach; ?>
</ul>
<?php endif; ?>
</body>
</html>
