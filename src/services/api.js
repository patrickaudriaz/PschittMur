import axios from 'axios';

// For local development, use the local Netlify Functions
// For production, use deployed Netlify Functions
const BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions';

// Helper function for localStorage fallback
const localStorageDB = {
  getProblems() {
    const data = localStorage.getItem('pschitt-mur-problems');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.routes || [];
    }
    return [];
  },
  
  getNextId() {
    const data = localStorage.getItem('pschitt-mur-problems');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.nextId || 1;
    }
    return 1;
  },
  
  saveProblems(problems, nextId) {
    localStorage.setItem('pschitt-mur-problems', JSON.stringify({
      routes: problems,
      nextId: nextId
    }));
  }
};

const api = {
  // Get all problems
  async getProblems() {
    try {
      const response = await axios.get(`${BASE_URL}/getProblems`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problems:', error);
      console.log('Falling back to localStorage');
      // Fallback to localStorage if MongoDB is unavailable
      return localStorageDB.getProblems();
    }
  },

  // Get a single problem by ID
  async getProblemById(id) {
    try {
      const response = await axios.get(`${BASE_URL}/getProblemById/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching problem ${id}:`, error);
      console.log('Falling back to localStorage');
      // Fallback to localStorage if MongoDB is unavailable
      const problems = localStorageDB.getProblems();
      return problems.find(problem => problem.id === parseInt(id));
    }
  },

  // Create a new problem
  async createProblem(problem) {
    try {
      const response = await axios.post(`${BASE_URL}/createProblem`, problem);
      return response.data;
    } catch (error) {
      console.error('Error creating problem:', error);
      console.log('Falling back to localStorage');
      // Fallback to localStorage if MongoDB is unavailable
      const problems = localStorageDB.getProblems();
      const nextId = localStorageDB.getNextId();
      
      const newProblem = {
        ...problem,
        id: nextId,
        createdAt: new Date().toISOString()
      };
      
      problems.push(newProblem);
      localStorageDB.saveProblems(problems, nextId + 1);
      
      return newProblem;
    }
  },

  // Update a problem
  async updateProblem(id, problem) {
    try {
      const response = await axios.put(`${BASE_URL}/updateProblem/${id}`, problem);
      return response.data;
    } catch (error) {
      console.error(`Error updating problem ${id}:`, error);
      console.log('Falling back to localStorage');
      // Fallback to localStorage if MongoDB is unavailable
      const problems = localStorageDB.getProblems();
      const index = problems.findIndex(p => p.id === parseInt(id));
      
      if (index !== -1) {
        problems[index] = {
          ...problems[index],
          ...problem,
          updatedAt: new Date().toISOString()
        };
        
        localStorageDB.saveProblems(problems, localStorageDB.getNextId());
        return problems[index];
      }
      
      throw new Error('Problem not found');
    }
  },

  // Delete a problem
  async deleteProblem(id) {
    try {
      const response = await axios.delete(`${BASE_URL}/deleteProblem/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting problem ${id}:`, error);
      console.log('Falling back to localStorage');
      // Fallback to localStorage if MongoDB is unavailable
      const problems = localStorageDB.getProblems();
      const index = problems.findIndex(p => p.id === parseInt(id));
      
      if (index !== -1) {
        problems.splice(index, 1);
        localStorageDB.saveProblems(problems, localStorageDB.getNextId());
        return { message: 'Problem deleted' };
      }
      
      throw new Error('Problem not found');
    }
  },

  // Get the next available ID
  async getNextId() {
    try {
      const response = await axios.get(`${BASE_URL}/getNextId`);
      return response.data.nextId;
    } catch (error) {
      console.error('Error fetching next ID:', error);
      console.log('Falling back to localStorage');
      // Fallback to localStorage if MongoDB is unavailable
      return localStorageDB.getNextId();
    }
  }
};

export default api; 