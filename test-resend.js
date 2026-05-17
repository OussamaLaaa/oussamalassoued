// Test Resend Email Integration
import fetch from 'node-fetch';

const testData = {
  name: 'Ahmed Test',
  email: 'test@example.com',
  subject: 'Test Email System',
  message: 'This is a test message to verify that the Resend email integration is working correctly. If you receive this message with the contact form details, then everything is set up properly!'
};

async function testAPI() {
  console.log('🧪 Testing Resend Email Integration...\n');
  
  try {
    // Test the messages endpoint
    const response = await fetch('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('📬 API Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Message sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Email Status:', result.email);
    } else {
      console.log('\n❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();
