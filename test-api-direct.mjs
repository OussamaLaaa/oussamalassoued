/**
 * Direct API Test - Testing Resend Email Integration
 * Run with: node test-api-direct.mjs
 */

import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the API handler
import messagesHandler from './api/messages.js';

async function testAPI() {
  console.log('🧪 Testing Resend Email Integration via Direct API Call...\n');
  
  const testData = {
    name: 'Ahmed Test',
    email: 'test@example.com',
    subject: 'Test Email System',
    message: 'This is a test message to verify that the Resend email integration is working correctly. If you receive this message with the contact form details, then everything is set up properly!'
  };

  // Mock Request object
  const mockReq = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'Test-Client/1.0',
    },
    body: JSON.stringify(testData),
    readableEnded: true,
    on: () => {}, // Mock event listener
    once: () => {}, // Mock event listener
  };

  // Mock Response object
  let statusCode = 200;
  let responseData = {};
  const mockRes = {
    statusCode: 200,
    setHeader: (key, value) => console.log(`Header: ${key} = ${value}`),
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      console.log(`\n✅ Response (Status: ${statusCode}):`);
      console.log(JSON.stringify(data, null, 2));
      return mockRes;
    },
    end: () => {
      console.log('\n✅ Response sent');
      return mockRes;
    },
  };

  try {
    console.log('📤 Sending test message:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n---\n');

    // Call the API handler
    await messagesHandler(mockReq, mockRes);

    // Check result
    if (responseData.success) {
      console.log('\n✅ SUCCESS! Message sent and email notification queued.');
      if (responseData.email?.emailId) {
        console.log(`📧 Email ID: ${responseData.email.emailId}`);
      }
      console.log(`\n📧 Email should arrive at: ${process.env.CONTACT_EMAIL_TO}`);
    } else {
      console.log('\n❌ ERROR:', responseData.error);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testAPI();
