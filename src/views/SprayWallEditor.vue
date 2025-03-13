<template>
  <div class="spray-wall-editor">
    <!-- Password Protection Modal -->
    <div v-if="!isAuthenticated" class="password-modal">
      <div class="password-modal-content">
        <h2>Password Required</h2>
        <p>Please enter the password to access the editor:</p>
        <div class="password-input-group">
          <input
            type="password"
            v-model="passwordInput"
            @keyup.enter="checkPassword"
            placeholder="Enter password"
            class="password-input"
          />
          <button @click="checkPassword" class="password-submit-btn">
            Submit
          </button>
        </div>
        <p v-if="passwordError" class="password-error">{{ passwordError }}</p>
      </div>
    </div>

    <!-- Editor Content (only shown after authentication) -->
    <div v-if="isAuthenticated" class="editor-content">
      <h1>Spray Wall Editor</h1>

      <div class="editor-container">
        <!-- Consolidated Controls -->
        <div class="editor-controls">
          <div class="controls-title">Hold Position Editor</div>
          <div class="controls-description">
            Click on the wall to add holds. Click on existing holds to remove
            them.
          </div>
          <div class="controls-actions">
            <button class="btn import-btn" @click="importHoldPositions">
              Import Positions
            </button>
            <button class="btn export-btn" @click="exportHoldPositions">
              Export to JSON
            </button>
            <button class="btn clear-btn" @click="clearAllHolds">
              Clear All Holds
            </button>
          </div>
          <input
            type="file"
            ref="fileInput"
            accept=".json"
            style="display: none"
            @change="handleFileImport"
          />
        </div>

        <!-- Spray Wall Component -->
        <SprayWall
          :holdPositions="holdPositions"
          :selectionMode="false"
          :editMode="true"
          :isCreateMode="false"
          @update:holdPositions="holdPositions = $event"
          ref="sprayWallRef"
        />

        <!-- Hold Count Info -->
        <div class="hold-count-info">
          <h3>Total Holds: {{ holdPositions.length }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import defaultHoldPositions from "../assets/holdPositions.json";
import SprayWall from "../components/SprayWall.vue";
import {
  exportHoldPositionsToFile,
  importHoldPositionsFromFile,
} from "../utils/holdPositionGenerator";

// Password protection
const CORRECT_PASSWORD = import.meta.env.VITE_EDITOR_PASSWORD;
const isAuthenticated = ref(false);
const passwordInput = ref("");
const passwordError = ref("");

function checkPassword() {
  if (passwordInput.value === CORRECT_PASSWORD) {
    isAuthenticated.value = true;
    passwordError.value = "";
  } else {
    passwordError.value = "Incorrect password. Please try again.";
    passwordInput.value = "";
  }
}

// State
const holdPositions = ref([...defaultHoldPositions]);
const fileInput = ref(null);
const sprayWallRef = ref(null);

// Watch for changes in holdPositions
watch(
  holdPositions,
  (newPositions) => {
    // Removed console.log for debugging
  },
  { deep: true }
);

// Import hold positions
function importHoldPositions() {
  fileInput.value.click();
}

// Handle file import
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const importedPositions = await importHoldPositionsFromFile(file);
    holdPositions.value = importedPositions;
    alert("Hold positions imported successfully!");
  } catch (error) {
    alert("Failed to import hold positions: " + error.message);
  } finally {
    // Reset file input
    fileInput.value.value = "";
  }
}

// Export hold positions
function exportHoldPositions() {
  // Removed console.log for debugging

  if (holdPositions.value.length === 0) {
    alert("No holds to export. Add some holds first.");
    return;
  }

  exportHoldPositionsToFile(holdPositions.value);
}

// Clear all holds
function clearAllHolds() {
  if (confirm("Are you sure you want to remove all holds?")) {
    holdPositions.value = [];
  }
}

// Debug function to log hold positions
// Removed debug function
</script>

<style lang="scss" scoped>
@use "sass:color";

.spray-wall-editor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  position: relative;
  min-height: 100vh;

  h1 {
    margin-bottom: 1rem;
    text-align: center;
  }

  // Password modal
  .password-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;

    &-content {
      background-color: white;
      padding: 2rem;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      max-width: 400px;
      width: 90%;
      text-align: center;

      h2 {
        margin-top: 0;
        color: var(--primary-color, #2196f3);
      }

      .password-input-group {
        display: flex;
        margin: 1.5rem 0;

        .password-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: var(--border-radius) 0 0 var(--border-radius);
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: var(--primary-color, #2196f3);
          }
        }

        .password-submit-btn {
          padding: 0.75rem 1.5rem;
          background-color: var(--primary-color, #2196f3);
          color: white;
          border: none;
          border-radius: 0 var(--border-radius) var(--border-radius) 0;
          cursor: pointer;
          font-weight: 500;

          &:hover {
            background-color: color.adjust(#2196f3, $lightness: -10%);
          }
        }
      }

      .password-error {
        color: #f44336;
        margin-top: 0.5rem;
        font-size: 0.9rem;
      }
    }
  }

  .editor-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .editor-controls {
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 1rem;

    .controls-title {
      font-size: 1.25rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--primary-color, #2196f3);
    }

    .controls-description {
      margin-bottom: 1rem;
      color: #666;
    }

    .controls-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;

      .btn {
        padding: 0.75rem 1rem;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: 500;
        color: white;

        &.import-btn {
          background-color: #9c27b0;

          &:hover {
            background-color: color.adjust(#9c27b0, $lightness: -10%);
          }
        }

        &.export-btn {
          background-color: #ff9800;

          &:hover {
            background-color: color.adjust(#ff9800, $lightness: -10%);
          }
        }

        &.clear-btn {
          background-color: #f44336;

          &:hover {
            background-color: color.adjust(#f44336, $lightness: -10%);
          }
        }
      }
    }
  }

  .hold-count-info {
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 1rem;
    text-align: center;

    h3 {
      margin: 0 0 0.5rem 0;
    }
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .spray-wall-editor {
    padding: 0.5rem;

    h1 {
      font-size: 1.5rem;
    }

    .editor-controls {
      .controls-actions {
        grid-template-columns: 1fr;
      }
    }

    .password-modal-content {
      padding: 1.5rem;

      .password-input-group {
        flex-direction: column;

        .password-input {
          border-radius: var(--border-radius);
          margin-bottom: 0.5rem;
        }

        .password-submit-btn {
          border-radius: var(--border-radius);
        }
      }
    }
  }
}
</style>
