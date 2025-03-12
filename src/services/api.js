import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = {
  // Get all problems
  async getProblems() {
    try {
      const response = await axios.get(`${API_URL}/problems`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
  },

  // Get a single problem by ID
  async getProblemById(id) {
    try {
      const response = await axios.get(`${API_URL}/problems/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching problem ${id}:`, error);
      throw error;
    }
  },

  // Create a new problem
  async createProblem(problem) {
    try {
      const response = await axios.post(`${API_URL}/problems`, problem);
      return response.data;
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    }
  },

  // Update a problem
  async updateProblem(id, problem) {
    try {
      const response = await axios.put(`${API_URL}/problems/${id}`, problem);
      return response.data;
    } catch (error) {
      console.error(`Error updating problem ${id}:`, error);
      throw error;
    }
  },

  // Delete a problem
  async deleteProblem(id) {
    try {
      const response = await axios.delete(`${API_URL}/problems/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting problem ${id}:`, error);
      throw error;
    }
  },

  // Get the next available ID
  async getNextId() {
    try {
      const response = await axios.get(`${API_URL}/next-id`);
      return response.data.nextId;
    } catch (error) {
      console.error('Error fetching next ID:', error);
      throw error;
    }
  }
};

export default api; 