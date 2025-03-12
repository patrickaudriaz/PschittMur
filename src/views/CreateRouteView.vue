<template>
  <div class="create-problem">
    <div class="container">
      <div class="page-header">
        <h3>Create New Problem</h3>
        <router-link to="/" class="back-btn">← Back</router-link>
      </div>

      <div class="problem-form-container">
        <form @submit.prevent="saveProblem" class="problem-form">
          <div class="form-group">
            <label for="problemName">Problem Name</label>
            <input
              type="text"
              id="problemName"
              v-model="routeName"
              placeholder="Enter problem name"
              required
            />
          </div>

          <div class="form-group">
            <label for="problemCreator">Creator</label>
            <input
              type="text"
              id="problemCreator"
              v-model="routeCreator"
              placeholder="Your name"
              required
            />
          </div>

          <div class="form-group">
            <label for="problemGrade">Grade (French Scale)</label>
            <select id="problemGrade" v-model="routeGrade" required>
              <option value="" disabled>Select grade</option>
              <option v-for="grade in fontGrades" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Select Holds</label>
            <p class="help-text">
              Select holds on the spray wall to create your problem. Each hold
              can be a start, hand, feet, or top hold.
            </p>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="save-btn"
              :disabled="!isFormValid || isSaving"
            >
              <span v-if="isSaving || isLoading">
                <span class="spinner"></span>
                Saving...
              </span>
              <span v-else>Save Problem</span>
            </button>
          </div>
        </form>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="spray-wall-section">
          <SprayWall
            :selectionMode="true"
            v-model:selectedHolds="selectedHolds"
          />

          <div class="selected-holds-summary" v-if="selectedHolds.length > 0">
            <h4 class="holds-count-title">Selected Holds</h4>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import SprayWall from "../components/SprayWall.vue";
import { useRouteStore } from "../stores/routeStore";

const router = useRouter();
const routeStore = useRouteStore();

// Form state
const routeName = ref("");
const routeCreator = ref("");
const routeGrade = ref("");
const selectedHolds = ref([]);
const isSaving = ref(false);

// Get store state
const isLoading = computed(() => routeStore.isLoading);
const error = computed(() => routeStore.error);

// Get font grades from store
const fontGrades = routeStore.fontGrades;

// Computed properties
const isFormValid = computed(() => {
  return (
    routeName.value.trim() !== "" &&
    routeCreator.value.trim() !== "" &&
    routeGrade.value !== "" &&
    selectedHolds.value.length > 0 &&
    hasRequiredHoldTypes()
  );
});

const holdTypeCounts = computed(() => {
  const counts = {};

  // Initialize counts for all hold types
  Object.values(routeStore.holdTypes).forEach((type) => {
    counts[type] = 0;
  });

  // Count holds by type
  selectedHolds.value.forEach((hold) => {
    counts[hold.type]++;
  });

  // Convert to array for template
  return Object.entries(counts).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));
});

// Check if problem has required hold types (at least one start and one top)
function hasRequiredHoldTypes() {
  const hasStart = selectedHolds.value.some(
    (hold) => hold.type === routeStore.holdTypes.START
  );
  const hasTop = selectedHolds.value.some(
    (hold) => hold.type === routeStore.holdTypes.TOP
  );

  return hasStart && hasTop;
}

// Save the problem
async function saveProblem() {
  if (!isFormValid.value) return;

  isSaving.value = true;

  try {
    const newProblem = {
      name: routeName.value,
      creator: routeCreator.value,
      grade: routeGrade.value,
      holds: selectedHolds.value,
    };

    const problemId = await routeStore.addRoute(newProblem);

    // Navigate to the problem details page
    router.push({ name: "ProblemDetails", params: { id: problemId } });
  } catch (error) {
    console.error("Error saving problem:", error);
    // Error is already handled in the store
  } finally {
    isSaving.value = false;
  }
}
</script>

<style lang="scss" scoped>
@use "sass:color";

.create-problem {
  padding: 1rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
  }
}

.back-btn {
  display: inline-block;
  background-color: var(--light-color);
  color: var(--dark-color);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: bold;
  font-size: 0.9rem;

  &:hover {
    background-color: color.scale(#ecf0f1, $lightness: -5%);
  }
}

.problem-form-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.problem-form {
  background-color: white;
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    input,
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: var(--border-radius);
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
      }
    }

    .help-text {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: #666;
    }
  }

  .form-actions {
    .save-btn {
      width: 100%;
      padding: 0.75rem;
      background-color: var(--secondary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
      }

      &:hover:not(:disabled) {
        background-color: color.scale(#2ecc71, $lightness: -5%);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}

.spray-wall-section {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.selected-holds-summary {
  margin-top: 1.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;

  h3 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
  }

  .holds-count-title {
    margin-bottom: 0.5rem;
  }

  .holds-count {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;

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

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
  border-radius: var(--border-radius);
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
