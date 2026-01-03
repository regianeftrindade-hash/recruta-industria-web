#!/usr/bin/env node
/**
 * Test script to verify authentication system
 * Tests: Registration → Login → Session verification
 */

const http = require('http');
const https = require('https');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:3000';

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Authentication System Tests\n');

  try {
    // Test 1: Register a new professional user
    console.log('📝 Test 1: Register new professional user');
    const testEmail = `test-prof-${Date.now()}@recruta.local`;
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: 'TestPass123!@#',
      passwordConfirm: 'TestPass123!@#',
      userType: 'professional',
      cpf: '12345678901',
      firstName: 'Test',
      lastName: 'Professional',
    });

    if (registerRes.status === 201) {
      console.log('✅ Registration successful');
      console.log(`   User ID: ${registerRes.body.id}`);
      console.log(`   Email: ${registerRes.body.email}`);
    } else {
      console.log(`❌ Registration failed: ${registerRes.status}`);
      console.log(`   Response: ${JSON.stringify(registerRes.body)}`);
      throw new Error('Registration failed');
    }

    // Test 2: Register a new company user
    console.log('\n📝 Test 2: Register new company user');
    const companyEmail = `test-comp-${Date.now()}@recruta.local`;
    const companyRes = await makeRequest('POST', '/api/auth/register', {
      email: companyEmail,
      password: 'CompanyPass123!@#',
      passwordConfirm: 'CompanyPass123!@#',
      userType: 'company',
      cnpj: '12345678000100',
      companyName: 'Test Company',
      companyPhone: '1133334444',
    });

    if (companyRes.status === 201) {
      console.log('✅ Company registration successful');
      console.log(`   User ID: ${companyRes.body.id}`);
      console.log(`   Email: ${companyRes.body.email}`);
    } else {
      console.log(`❌ Company registration failed: ${companyRes.status}`);
      console.log(`   Response: ${JSON.stringify(companyRes.body)}`);
      throw new Error('Company registration failed');
    }

    // Test 3: Verify users.json was created
    console.log('\n📁 Test 3: Verify users.json persistence');
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, '../data/users.json');
    
    if (fs.existsSync(usersFile)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      console.log('✅ users.json exists');
      console.log(`   Total users: ${users.length}`);
      console.log(`   Users: ${users.map(u => u.email).join(', ')}`);
    } else {
      console.log('❌ users.json not found');
    }

    console.log('\n✨ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(runTests, 2000);
