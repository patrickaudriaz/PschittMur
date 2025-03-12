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

  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Get the ID from the path parameter
    const id = event.path.split('/').pop();
    
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Problem ID is required' })
      };
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Delete the problem
    const result = await db.collection('problems').deleteOne({ id: parseInt(id) });
    
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Problem not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Problem deleted' })
    };
  } catch (error) {
    console.error(`Error deleting problem:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error deleting problem' })
    };
  }
}; 