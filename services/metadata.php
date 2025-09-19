<?php
header('Content-Type: application/json');

// Get URL from query string
if (!isset($_GET['url'])) {
    echo json_encode(['error' => 'Missing url parameter']);
    exit;
}

$url = $_GET['url'];

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

// Fetch the page content with realistic browser headers
$options = [
    'http' => [
        'method'  => "GET",
        'header'  => implode("\r\n", [
            "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language: en-US,en;q=0.9",
            "DNT: 1",
            "Connection: keep-alive",
            "Upgrade-Insecure-Requests: 1"
        ]) . "\r\n",
        'timeout' => 30,
        'ignore_errors' => true
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false
    ]
];
$context = stream_context_create($options);
$html = @file_get_contents($url, false, $context);

if (!$html) {
    // Get more detailed error information
    $error = error_get_last();
    $errorMessage = $error ? $error['message'] : 'Could not fetch the URL';
    echo json_encode(['error' => $errorMessage]);
    exit;
}

// Load into DOM
libxml_use_internal_errors(true);
$doc = new DOMDocument();
$doc->loadHTML($html);
libxml_clear_errors();

$xpath = new DOMXPath($doc);

// Helper function
function queryContent($xpath, $query) {
    $nodes = $xpath->query($query);
    if ($nodes->length > 0) {
        $node = $nodes->item(0);
        $content = $node->getAttribute('content') ?: $node->nodeValue ?: $node->getAttribute('href');
        return trim($content) ?: null;
    }
    return null;
}

// Helper function to resolve relative URLs
function resolveUrl($baseUrl, $relativeUrl) {
    if (empty($relativeUrl)) return null;
    
    // Already absolute URL
    if (parse_url($relativeUrl, PHP_URL_SCHEME)) {
        return $relativeUrl;
    }
    
    $base = parse_url($baseUrl);
    if (!$base) return $relativeUrl;
    
    // Protocol relative URL
    if (substr($relativeUrl, 0, 2) === '//') {
        return ($base['scheme'] ?? 'https') . ':' . $relativeUrl;
    }
    
    // Absolute path
    if (substr($relativeUrl, 0, 1) === '/') {
        return ($base['scheme'] ?? 'https') . '://' . $base['host'] . 
               (isset($base['port']) ? ':' . $base['port'] : '') . $relativeUrl;
    }
    
    // Relative path
    $basePath = isset($base['path']) ? dirname($base['path']) : '';
    if ($basePath === '.') $basePath = '';
    
    return ($base['scheme'] ?? 'https') . '://' . $base['host'] . 
           (isset($base['port']) ? ':' . $base['port'] : '') . 
           $basePath . '/' . $relativeUrl;
}

// Extract metadata with multiple fallbacks
$title = queryContent($xpath, '//meta[@property="og:title"]') ?: 
         queryContent($xpath, '//meta[@name="twitter:title"]') ?: 
         queryContent($xpath, '//title');

// Try multiple image sources with fallbacks
$thumbnail = queryContent($xpath, '//meta[@property="og:image"]') ?: 
             queryContent($xpath, '//meta[@property="og:image:url"]') ?: 
             queryContent($xpath, '//meta[@name="twitter:image"]') ?: 
             queryContent($xpath, '//meta[@name="twitter:image:src"]') ?: 
             queryContent($xpath, '//link[@rel="image_src"]') ?:
             queryContent($xpath, '//meta[@name="thumbnail"]');

// Resolve relative URLs to absolute
if ($thumbnail) {
    $thumbnail = resolveUrl($url, $thumbnail);
}

$data = [
    'title' => $title,
    'thumbnail' => $thumbnail
];

echo json_encode($data);
