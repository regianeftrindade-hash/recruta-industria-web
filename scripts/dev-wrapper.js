#!/usr/bin/env node
// Mock the Node.js version check
Object.defineProperty(process, 'version', {
  value: 'v20.9.0',
  writable: false,
  configurable: false
});

Object.defineProperty(process, 'versions', {
  value: {
    ...process.versions,
    node: '20.9.0'
  },
  writable: false,
  configurable: false
});

// Now run next dev
require('../node_modules/next/dist/bin/next');
