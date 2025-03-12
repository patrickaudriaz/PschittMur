<template>
  <div class="problem-details">
    <div class="container">
      <div class="page-header">
        <router-link to="/" class="back-btn">← Back</router-link>
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading problem details...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <router-link to="/" class="btn-primary">← Back</router-link>
      </div>

      <div v-else-if="!route" class="problem-not-found">
        <h2>Problem Not Found</h2>
        <p>The problem you're looking for doesn't exist or has been removed.</p>
        <router-link to="/" class="btn-primary">← Back</router-link>
      </div>

      <div v-else class="problem-content">
        <div class="problem-info-panel">
          <div class="problem-header">
            <h2 class="problem-name">{{ route.name }}</h2>
            <div class="problem-grade">{{ route.grade }}</div>
          </div>

          <div class="problem-meta">
            <div class="problem-creator">
              <strong>Set by:</strong> {{ route.creator }}
            </div>
            <div class="problem-date">
              <strong>Created:</strong> {{ formatDate(route.createdAt) }}
            </div>
          </div>

          <div class="problem-holds-summary">
            <h3>Holds</h3>
            <div class="holds-count">
              <div
                class="hold-type-count"
                v-for="type in holdTypeCounts"
                :key="type.type"
              >
                <span class="hold-type-label">{{ type.type }}:</span>
                <span class="hold-type-value">{{ type.count }}</span>
              </div>
            </div>
          </div>

          <div class="problem-actions">
            <button class="delete-btn" @click="confirmDelete">
              Delete Problem
            </button>
          </div>
        </div>

        <div class="spray-wall-container">
          <SprayWall :selectedHolds="route.holds" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import SprayWall from "../components/SprayWall.vue";
import { useRouteStore } from "../stores/routeStore";

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
});

const router = useRouter();
const routeStore = useRouteStore();

// Get problem by ID and loading states
const route = computed(() => {
  return routeStore.getRouteById(props.id);
});
const isLoading = computed(() => routeStore.isLoading);
const error = computed(() => routeStore.error);

// Count holds by type
const holdTypeCounts = computed(() => {
  if (!route.value || !route.value.holds) return [];

  const counts = {};

  // Initialize counts for all hold types
  Object.values(routeStore.holdTypes).forEach((type) => {
    counts[type] = 0;
  });

  // Count holds by type
  route.value.holds.forEach((hold) => {
    counts[hold.type]++;
  });

  // Convert to array for template
  return Object.entries(counts).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));
});

// Format date
function formatDate(dateString) {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Delete problem
function confirmDelete() {
  if (confirm(`Are you sure you want to delete "${route.value.name}"?`)) {
    routeStore.deleteRoute(props.id);
    router.push("/");
  }
}
</script>

<style lang="scss" scoped>
@use "sass:color";

.problem-details {
  padding: 1rem 0;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-btn {
  display: inline-block;
  background-color: var(--light-color);
  color: var(--dark-color);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: bold;

  &:hover {
    background-color: color.scale(#ecf0f1, $lightness: -5%);
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
}

.problem-not-found {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1.5rem;
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
  }
}

.problem-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.problem-info-panel {
  background-color: white;
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  .problem-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    .problem-name {
      margin: 0;
      font-size: 1.4rem;
    }

    .problem-grade {
      background-color: var(--dark-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius);
      font-weight: bold;
      font-size: 1.1rem;
    }
  }

  .problem-meta {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #eee;

    .problem-creator,
    .problem-date {
      margin-bottom: 0.5rem;
      color: #666;
    }
  }

  .problem-holds-summary {
    margin-bottom: 1.5rem;

    h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    .holds-count {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;

      .hold-type-count {
        background-color: #f5f5f5;
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius);

        .hold-type-label {
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .hold-type-value {
          font-weight: bold;
        }
      }
    }
  }

  .problem-actions {
    .delete-btn {
      width: 100%;
      padding: 0.75rem;
      background-color: var(--danger-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;

      &:hover {
        background-color: color.scale(#e74c3c, $lightness: -5%);
      }
    }
  }
}

.spray-wall-container {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}
</style>
