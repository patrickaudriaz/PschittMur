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
  // Load all problems from the API
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
      
      // Fallback to localStorage if API fails
      loadFromLocalStorage();
    } finally {
      isLoading.value = false;
    }
  }

  // Add a new problem
  async function addRoute(route) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const newRoute = {
        ...route,
        id: nextId.value,
        createdAt: new Date().toISOString()
      };
      
      // Save to API
      const savedRoute = await api.createProblem(newRoute);
      
      // Update local state
      routes.value.push(savedRoute);
      nextId.value++;
      
      // Also save to localStorage as backup
      saveToLocalStorage();
      
      return savedRoute.id;
    } catch (err) {
      console.error('Failed to add problem:', err);
      error.value = 'Failed to add problem. Please try again.';
      
      // Fallback to localStorage only
      const newRoute = {
        ...route,
        id: nextId.value,
        createdAt: new Date().toISOString()
      };
      
      routes.value.push(newRoute);
      nextId.value++;
      saveToLocalStorage();
      
      return newRoute.id;
    } finally {
      isLoading.value = false;
    }
  }

  // Update an existing problem
  async function updateRoute(id, updatedRoute) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const routeToUpdate = {
        ...updatedRoute,
        updatedAt: new Date().toISOString()
      };
      
      // Update in API
      await api.updateProblem(id, routeToUpdate);
      
      // Update local state
      const index = routes.value.findIndex(route => route.id === parseInt(id));
      if (index !== -1) {
        routes.value[index] = {
          ...routes.value[index],
          ...routeToUpdate
        };
      }
      
      // Also update localStorage as backup
      saveToLocalStorage();
      
      return true;
    } catch (err) {
      console.error(`Failed to update problem ${id}:`, err);
      error.value = 'Failed to update problem. Please try again.';
      
      // Fallback to localStorage only
      const index = routes.value.findIndex(route => route.id === parseInt(id));
      if (index !== -1) {
        routes.value[index] = {
          ...routes.value[index],
          ...updatedRoute,
          updatedAt: new Date().toISOString()
        };
        saveToLocalStorage();
        return true;
      }
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
      // Delete from API
      await api.deleteProblem(id);
      
      // Update local state
      const index = routes.value.findIndex(route => route.id === parseInt(id));
      if (index !== -1) {
        routes.value.splice(index, 1);
      }
      
      // Also update localStorage as backup
      saveToLocalStorage();
      
      return true;
    } catch (err) {
      console.error(`Failed to delete problem ${id}:`, err);
      error.value = 'Failed to delete problem. Please try again.';
      
      // Fallback to localStorage only
      const index = routes.value.findIndex(route => route.id === parseInt(id));
      if (index !== -1) {
        routes.value.splice(index, 1);
        saveToLocalStorage();
        return true;
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // LocalStorage persistence (as backup)
  function saveToLocalStorage() {
    localStorage.setItem('pschitt-mur-problems', JSON.stringify({
      routes: routes.value,
      nextId: nextId.value
    }));
  }

  function loadFromLocalStorage() {
    // Try to load from the new key first
    let data = localStorage.getItem('pschitt-mur-problems');
    
    // If no data found, try the old key for backward compatibility
    if (!data) {
      data = localStorage.getItem('pschitt-mur-routes');
      
      // If data found in old key, migrate it to the new key and remove the old one
      if (data) {
        localStorage.setItem('pschitt-mur-problems', data);
        localStorage.removeItem('pschitt-mur-routes');
      }
    }
    
    if (data) {
      const parsed = JSON.parse(data);
      routes.value = parsed.routes;
      nextId.value = parsed.nextId;
    }
  }

  // Initialize: first try to load from API, then fall back to localStorage if needed
  function initialize() {
    loadProblems().catch(() => {
      loadFromLocalStorage();
    });
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