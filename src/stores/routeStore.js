import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../services/api'

export const useRouteStore = defineStore('problems', () => {
  // State
  const routes = ref([])
  const nextId = ref(1)
  const isLoading = ref(false)
  const error = ref(null)

  // Hold types
  const holdTypes = {
    START: 'start',
    HAND: 'hand',
    FEET: 'feet',
    TOP: 'top'
  }

  // French grading scale for bouldering
  const fontGrades = [
    '4', '4+', 
    '5a', '5b', '5c', 
    '6a', '6a+', '6b', '6b+', '6c', '6c+',
    '7a', '7a+', '7b', '7b+', '7c', '7c+',
    '8a', '8a+', '8b', '8b+', '8c', '8c+', '9c'
  ]

  // Getters
  const getRouteById = computed(() => {
    return (id) => routes.value.find(route => route.id === parseInt(id))
  })

  // Actions
  // Load all problems
  async function loadProblems() {
    isLoading.value = true;
    error.value = null;
    
    try {
      routes.value = await api.getProblems();
      // Also fetch the next available ID
      nextId.value = await api.getNextId();
    } catch (err) {
      console.error('Failed to load problems:', err);
      error.value = 'Failed to load problems. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }

  // Add a new problem
  async function addRoute(route) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const savedRoute = await api.createProblem(route);
      
      // Update local state
      routes.value.push(savedRoute);
      nextId.value++;
      
      return savedRoute.id;
    } catch (err) {
      console.error('Failed to add problem:', err);
      error.value = 'Failed to add problem. Please try again.';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Update an existing problem
  async function updateRoute(id, updatedRoute) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const updated = await api.updateProblem(id, updatedRoute);
      
      // Update local state
      const index = routes.value.findIndex(route => route.id === parseInt(id));
      if (index !== -1) {
        routes.value[index] = updated;
      }
      
      return true;
    } catch (err) {
      console.error(`Failed to update problem ${id}:`, err);
      error.value = 'Failed to update problem. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Delete a problem
  async function deleteRoute(id) {
    isLoading.value = true;
    error.value = null;
    
    try {
      await api.deleteProblem(id);
      
      // Update local state
      const index = routes.value.findIndex(route => route.id === parseInt(id));
      if (index !== -1) {
        routes.value.splice(index, 1);
      }
      
      return true;
    } catch (err) {
      console.error(`Failed to delete problem ${id}:`, err);
      error.value = 'Failed to delete problem. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Initialize: load problems from localStorage
  function initialize() {
    loadProblems();
  }

  // Call initialize when the store is created
  initialize();

  return {
    routes,
    holdTypes,
    fontGrades,
    isLoading,
    error,
    getRouteById,
    addRoute,
    updateRoute,
    deleteRoute,
    loadProblems
  }
})