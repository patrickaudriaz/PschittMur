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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const problemData = JSON.parse(event.body);
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Get the next available ID
    const lastProblem = await db.collection('problems').findOne({}, { sort: { id: -1 } });
    const nextId = lastProblem ? lastProblem.id + 1 : 1;
    
    // Create the new problem
    const newProblem = {
      ...problemData,
      id: nextId,
      createdAt: new Date().toISOString()
    };
    
    // Insert the problem into the database
    await db.collection('problems').insertOne(newProblem);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newProblem)
    };
  } catch (error) {
    console.error('Error creating problem:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Error creating problem' })
    };
  }
}; 