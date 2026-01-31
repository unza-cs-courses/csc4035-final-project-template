#!/usr/bin/env node
/**
 * CSC4035 Final Project - Visible Tests
 *
 * These tests check basic functionality and structure requirements.
 * Hidden tests will check edge cases and advanced features after deadline.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function test(name, fn) {
    try {
        fn();
        results.passed++;
        results.tests.push({ name, status: 'passed' });
        console.log(`  ✓ ${name}`);
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: 'failed', error: error.message });
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Helper to make HTTP requests
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('\n=== CSC4035 Final Project - Visible Tests ===\n');

    // =========================================================================
    // STRUCTURE TESTS
    // =========================================================================
    console.log('Structure Tests:');

    test('server/server.js exists', () => {
        assert(fs.existsSync('server/server.js'), 'server/server.js not found');
    });

    test('public/index.html exists', () => {
        assert(fs.existsSync('public/index.html'), 'public/index.html not found');
    });

    test('public/css/styles.css exists', () => {
        assert(fs.existsSync('public/css/styles.css'), 'public/css/styles.css not found');
    });

    test('public/js/app.js exists', () => {
        assert(fs.existsSync('public/js/app.js'), 'public/js/app.js not found');
    });

    test('package.json has start script', () => {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        assert(pkg.scripts && pkg.scripts.start, 'package.json missing start script');
    });

    // =========================================================================
    // HTML TESTS
    // =========================================================================
    console.log('\nHTML Tests:');

    test('HTML has proper doctype', () => {
        const html = fs.readFileSync('public/index.html', 'utf8');
        assert(html.toLowerCase().includes('<!doctype html>'), 'Missing DOCTYPE');
    });

    test('HTML has lang attribute', () => {
        const html = fs.readFileSync('public/index.html', 'utf8');
        assert(/lang\s*=\s*["']/.test(html), 'Missing lang attribute');
    });

    test('HTML has viewport meta tag', () => {
        const html = fs.readFileSync('public/index.html', 'utf8');
        assert(html.includes('viewport'), 'Missing viewport meta tag');
    });

    test('HTML has semantic elements', () => {
        const html = fs.readFileSync('public/index.html', 'utf8');
        const hasHeader = /<header/i.test(html);
        const hasMain = /<main/i.test(html);
        const hasFooter = /<footer/i.test(html);
        assert(hasHeader && hasMain && hasFooter, 'Missing semantic elements (header, main, footer)');
    });

    // =========================================================================
    // CSS TESTS
    // =========================================================================
    console.log('\nCSS Tests:');

    test('CSS uses custom properties', () => {
        const css = fs.readFileSync('public/css/styles.css', 'utf8');
        assert(/--[\w-]+\s*:/.test(css), 'No CSS custom properties found');
    });

    test('CSS has media queries', () => {
        const css = fs.readFileSync('public/css/styles.css', 'utf8');
        assert(/@media/.test(css), 'No media queries found');
    });

    test('CSS uses flexbox or grid', () => {
        const css = fs.readFileSync('public/css/styles.css', 'utf8');
        const hasFlexbox = /display\s*:\s*flex/.test(css);
        const hasGrid = /display\s*:\s*grid/.test(css);
        assert(hasFlexbox || hasGrid, 'No flexbox or grid layouts found');
    });

    // =========================================================================
    // JAVASCRIPT TESTS
    // =========================================================================
    console.log('\nJavaScript Tests:');

    test('JS uses const/let (not var)', () => {
        const js = fs.readFileSync('public/js/app.js', 'utf8');
        const usesVar = /\bvar\s+\w/.test(js);
        assert(!usesVar, 'Using var instead of const/let');
    });

    test('JS has async/await patterns', () => {
        const js = fs.readFileSync('public/js/app.js', 'utf8');
        assert(/async\s+function|async\s*\(/.test(js) || /await\s+/.test(js),
            'No async/await patterns found');
    });

    test('JS has event listeners', () => {
        const js = fs.readFileSync('public/js/app.js', 'utf8');
        assert(/addEventListener/.test(js), 'No event listeners found');
    });

    // =========================================================================
    // API TESTS (requires server running)
    // =========================================================================
    console.log('\nAPI Tests:');

    // Start server for API tests
    let server;
    try {
        // Fork a process to run the server
        const { spawn } = require('child_process');
        server = spawn('node', ['server/server.js'], {
            stdio: 'pipe',
            detached: true
        });

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Health check
        test('API health endpoint works', async () => {
            const res = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/health',
                method: 'GET'
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            assert(res.body && res.body.success === true, 'Health check should return success');
        });

        // GET items
        test('GET /api/items returns array', async () => {
            const res = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/items',
                method: 'GET'
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
            assert(res.body && res.body.success === true, 'Should return success');
            assert(Array.isArray(res.body.data), 'Data should be an array');
        });

        // POST item
        test('POST /api/items creates item', async () => {
            const res = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/items',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { name: 'Test Item' }
            });
            assert(res.status === 201, `Expected 201, got ${res.status}`);
            assert(res.body && res.body.success === true, 'Should return success');
            assert(res.body.data && res.body.data.id, 'Created item should have id');
        });

        // POST validation
        test('POST /api/items validates input', async () => {
            const res = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/items',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { name: '' }
            });
            assert(res.status === 400, `Expected 400 for invalid input, got ${res.status}`);
        });

        // 404 handler
        test('API returns 404 for unknown endpoints', async () => {
            const res = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/nonexistent',
                method: 'GET'
            });
            assert(res.status === 404, `Expected 404, got ${res.status}`);
        });

        // Static files
        test('Server serves static files', async () => {
            const res = await makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/',
                method: 'GET'
            });
            assert(res.status === 200, `Expected 200, got ${res.status}`);
        });

    } catch (error) {
        console.log(`  ! API tests skipped: ${error.message}`);
    } finally {
        // Cleanup server
        if (server) {
            process.kill(-server.pid, 'SIGTERM');
        }
    }

    // =========================================================================
    // RESULTS
    // =========================================================================
    console.log('\n=== Results ===');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Score: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);

    // Write results to file
    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));

    // Exit with error code if any tests failed
    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
