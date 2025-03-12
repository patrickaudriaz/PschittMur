<template>
  <div class="home">
    <div class="container">
      <div class="problems-header">
        <div>
          <h3>Bouldering Problems</h3>
          <p class="welcome-message">
            Welcome to the "Pschitt Mur" app for Le Hangar climbing gym in
            Fribourg! Create and share your spray wall boulder problems with the
            community.
          </p>
        </div>
        <div class="header-actions">
          <div class="sort-controls">
            <label for="sortBy">Sort by:</label>
            <select id="sortBy" v-model="sortBy" class="sort-select">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A-Z)</option>
              <option value="grade">Grade (Easiest first)</option>
              <option value="grade-desc">Grade (Hardest first)</option>
            </select>
          </div>
          <router-link to="/create" class="create-problem-btn">
            Create New Problem
          </router-link>
        </div>
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading problems...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button @click="refreshProblems" class="refresh-btn">Try Again</button>
      </div>

      <div v-else-if="routes.length === 0" class="no-problems">
        <p>No problems created yet. Be the first to add a problem!</p>
        <router-link to="/create" class="btn-primary">
          Create Problem
        </router-link>
      </div>

      <div v-else class="problems-list">
        <div
          v-for="route in sortedRoutes"
          :key="route.id"
          class="problem-card"
          @click="viewProblemDetails(route.id)"
        >
          <div class="problem-grade">{{ route.grade }}</div>
          <div class="problem-info">
            <h3 class="problem-name">{{ route.name }}</h3>
            <p class="problem-creator">Set by: {{ route.creator }}</p>
            <p class="problem-date">
              Created: {{ formatDate(route.createdAt) }}
            </p>
            <p class="problem-holds-count">{{ getHoldsCount(route) }} holds</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useRouteStore } from "../stores/routeStore";

const router = useRouter();
const routeStore = useRouteStore();
const sortBy = ref("newest");

// Get all routes and loading states
const routes = computed(() => routeStore.routes);
const isLoading = computed(() => routeStore.isLoading);
const error = computed(() => routeStore.error);

// Sort routes based on selected criteria
const sortedRoutes = computed(() => {
  const routesCopy = [...routes.value];

  switch (sortBy.value) {
    case "newest":
      return routesCopy.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

    case "oldest":
      return routesCopy.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

    case "name":
      return routesCopy.sort((a, b) => a.name.localeCompare(b.name));

    case "grade":
      return routesCopy.sort((a, b) => {
        // Custom sort for font grades
        const gradeOrder = routeStore.fontGrades;
        return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
      });

    case "grade-desc":
      return routesCopy.sort((a, b) => {
        // Custom sort for font grades (descending)
        const gradeOrder = routeStore.fontGrades;
        return gradeOrder.indexOf(b.grade) - gradeOrder.indexOf(a.grade);
      });

    default:
      return routesCopy;
  }
});

const getHoldsCount = (route) => {
  return route.holds ? route.holds.length : 0;
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const viewProblemDetails = (id) => {
  router.push({ name: "ProblemDetails", params: { id } });
};

// Refresh problems from the server
function refreshProblems() {
  routeStore.loadProblems();
}
</script>

<style lang="scss" scoped>
@use "sass:color";

.home {
  padding: 1rem 0;
}

.problems-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  h2 {
    margin: 0;
  }

  .welcome-message {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: #666;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    @media (max-width: 768px) {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }
  }

  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    @media (max-width: 768px) {
      width: 100%;
    }

    label {
      font-weight: bold;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .sort-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: var(--border-radius);
      background-color: white;
      font-size: 0.9rem;

      @media (max-width: 768px) {
        flex-grow: 1;
      }

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }
  }
}

.create-problem-btn {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: bold;
  white-space: nowrap;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
  }

  &:hover {
    background-color: color.scale(#3498db, $lightness: -10%);
  }
}

.no-problems {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  p {
    margin-bottom: 1rem;
    color: #666;
  }

  .btn-primary {
    display: inline-block;
    background-color: var(--primary-color);
    color: white;
    padding: 0.5rem 1.5rem;
    border-radius: var(--border-radius);
    text-decoration: none;
    font-weight: bold;
    font-size: 0.9rem;
  }
}

.problems-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.problem-card {
  display: flex;
  background-color: white;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--box-shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .problem-grade {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    background-color: var(--dark-color);
    color: white;
    font-weight: bold;
    font-size: 1.1rem;
  }

  .problem-info {
    flex: 1;
    padding: 1rem;

    .problem-name {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    .problem-creator,
    .problem-date,
    .problem-holds-count {
      margin: 0 0 0.25rem;
      font-size: 0.9rem;
      color: #666;
    }

    .problem-holds-count {
      margin-bottom: 0;
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}

.error-container {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  .error-message {
    color: var(--danger-color);
    margin-bottom: 1.5rem;
  }

  .refresh-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    padding: 0.5rem 1.5rem;
    font-weight: bold;
    cursor: pointer;

    &:hover {
      background-color: color.scale(#3498db, $lightness: -10%);
    }
  }
}
</style>
