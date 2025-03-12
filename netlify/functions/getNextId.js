const { connectToDatabase } = require('./utils/mongodb');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET'
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
    
    // Get the last problem to determine the next ID
    const lastProblem = await db.collection('problems').findOne({}, { sort: { id: -1 } });
    const nextId = lastProblem ? lastProblem.id + 1 : 1;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ nextId })
    };
  } catch (error) {
    console.error('Error fetching next ID:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error fetching next ID' })
    };
  }
}; 