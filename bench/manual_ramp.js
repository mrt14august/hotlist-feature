#!/usr/bin/env node
// Manual ramp-up benchmarking script using autocannon
// Usage: node bench/manual_ramp.js [--url <url>] [--user-id <id>] [--start 100] [--end 10000] [--step 100] [--duration 20]

const autocannon = require('autocannon');
const readline = require('readline');

const argv = require('minimist')(process.argv.slice(2));

const url = argv.url || 'http://localhost:3000/api/mylist/items?page=1&pageSize=2';
const userId = argv['user-id'] || process.env.USER_ID || '';
const start = parseInt(argv.start || '100', 10); // starting concurrency
const end = parseInt(argv.end || '10000', 10);   // max concurrency
const step = parseInt(argv.step || '100', 10);   // step size
const duration = parseInt(argv.duration || '20', 10); // seconds per step
const rate = argv.rate ? parseInt(argv.rate, 10) : undefined; // requests per second (optional)

console.log(`Benchmarking ${url}`);
console.log(`User-ID: ${userId}`);
console.log(`Start: ${start}, End: ${end}, Step: ${step}, Duration: ${duration}s, Rate: ${rate || 'max'}`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function runStep(connections) {
  return new Promise((resolve) => {
    console.log(`\n=== Running: ${connections} connections for ${duration}s ===`);
    const instance = autocannon({
      url,
      connections,
      duration,
      pipelining: 1,
      headers: { 'user-id': userId },
      ...(rate ? { overallRate: rate } : {})
    });

    // Print live stats every 5 seconds
    const statusInterval = setInterval(() => {
      const stats = instance.stats;
      if (stats && stats.latency && stats.requests) {
        console.log(`[${new Date().toISOString()}] Latency avg: ${stats.latency.average}ms, RPS: ${stats.requests.average}, Errors: ${stats.errors}`);
      } else {
        console.log(`[${new Date().toISOString()}] Warming up...`);
      }
    }, 5000);

    instance.on('done', (result) => {
      clearInterval(statusInterval);
      console.log(autocannon.printResult(result));
      rl.question('Continue to next step? (y/n): ', (answer) => {
        if (answer.trim().toLowerCase() === 'n') {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });

    instance.on('error', (err) => {
      clearInterval(statusInterval);
      console.error('Error:', err);
      resolve(false);
    });
  });
}

(async () => {
  for (let c = start; c <= end; c += step) {
    const cont = await runStep(c);
    if (!cont) break;
  }
  rl.close();
  console.log('Benchmarking complete.');
})();
