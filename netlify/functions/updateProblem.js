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

  // Only allow PUT requests
  if (event.httpMethod !== 'PUT') {
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

    // Parse the request body
    const updateData = JSON.parse(event.body);
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Update the problem
    const updatedProblem = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Find and update the problem
    const result = await db.collection('problems').findOneAndUpdate(
      { id: parseInt(id) },
      { $set: updatedProblem },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Problem not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.value)
    };
  } catch (error) {
    console.error(`Error updating problem:`, error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error updating problem' })
    };
  }
}; 