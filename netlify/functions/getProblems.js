const { connectToDatabase } = require('./utils/mongodb');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get all problems, sorted by creation date (newest first)
    const problems = await db.collection('problems')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(problems)
    };
  } catch (error) {
    console.error('Error fetching problems:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error fetching problems' })
    };
  }
}; 