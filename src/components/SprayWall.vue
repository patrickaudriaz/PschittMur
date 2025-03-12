<template>
  <div class="spray-wall-container">
    <div class="spray-wall" ref="sprayWallRef">
      <img
        :src="sprayWallImage"
        alt="Spray Wall"
        class="spray-wall-image"
        @load="initializeHolds"
        @click="editMode && handleImageClick($event)"
      />

      <!-- Holds overlay -->
      <div
        v-for="(hold, index) in displayHolds"
        :key="index"
        class="hold"
        :class="[
          { 'hold-selected': isHoldSelected(index) && !editMode },
          selectedHoldType(index),
          { 'hold-edit': editMode },
        ]"
        :style="{
          left: `${hold.pixelX}px`,
          top: `${hold.pixelY}px`,
          width: `${hold.size}px`,
          height: `${hold.size}px`,
          transform: 'translate(-50%, -50%)',
        }"
        @click.stop="editMode ? removeHold(index) : toggleHold(index)"
      ></div>
    </div>

    <div v-if="selectionMode && !editMode" class="hold-type-selector">
      <div class="hold-type-title">Select hold type:</div>
      <div class="hold-type-buttons">
        <button
          v-for="type in holdTypes"
          :key="type"
          class="hold-type-button"
          :class="{ active: currentHoldType === type }"
          @click="currentHoldType = type"
        >
          {{ type.charAt(0).toUpperCase() + type.slice(1) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import defaultHoldPositions from "../assets/holdPositions.json";
import { useRouteStore } from "../stores/routeStore";

// Props
const props = defineProps({
  selectionMode: {
    type: Boolean,
    default: false,
  },
  selectedHolds: {
    type: Array,
    default: () => [],
  },
  holdPositions: {
    type: Array,
    default: () => defaultHoldPositions,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits([
  "update:selectedHolds",
  "update:holdPositions",
  "update:editMode",
]);

// Store
const routeStore = useRouteStore();
const holdTypes = Object.values(routeStore.holdTypes);

// State
const sprayWallRef = ref(null);
const holds = ref([]);
const displayHolds = ref([]);
const currentHoldType = ref(routeStore.holdTypes.HAND);
const sprayWallImage = "/spraywall.jpg";
const defaultHoldSize = ref(20); // Default size for all holds
const originalHoldPositions = ref([]); // Store original positions for cancel
const imageWidth = ref(0);
const imageHeight = ref(0);

// Watch for changes in props
watch(
  () => props.holdPositions,
  (newPositions) => {
    if (newPositions && sprayWallRef.value) {
      holds.value = [...newPositions];
      updateDisplayHolds();
    }
  },
  { deep: true }
);

watch(
  () => props.editMode,
  (newEditMode) => {
    if (newEditMode) {
      // Store original positions when entering edit mode
      originalHoldPositions.value = JSON.parse(
        JSON.stringify(props.holdPositions)
      );
    }
  }
);

// Update display holds whenever the image size changes
function updateDisplayHolds() {
  const img = sprayWallRef.value?.querySelector("img");
  if (!img) return;

  imageWidth.value = img.clientWidth;
  imageHeight.value = img.clientHeight;

  // Calculate default hold size based on image dimensions
  defaultHoldSize.value = Math.min(imageWidth.value, imageHeight.value) * 0.05; // 5% of the image size

  // Convert relative positions to pixel positions for display
  displayHolds.value = holds.value.map((hold) => ({
    pixelX: Math.round(hold.x * imageWidth.value),
    pixelY: Math.round(hold.y * imageHeight.value),
    size: defaultHoldSize.value,
    // Keep original relative positions
    x: hold.x,
    y: hold.y,
  }));
}

// Initialize holds from provided JSON data
function initializeHolds() {
  // Wait for the image to load to get its dimensions
  const img = sprayWallRef.value?.querySelector("img");
  if (!img) return;

  imageWidth.value = img.clientWidth;
  imageHeight.value = img.clientHeight;

  // Calculate default hold size based on image dimensions
  defaultHoldSize.value = Math.min(imageWidth.value, imageHeight.value) * 0.05; // 5% of the image size

  // Store the original hold positions (relative coordinates)
  holds.value = [...props.holdPositions];

  // Update display holds
  updateDisplayHolds();

  // Add window resize listener to update hold positions when window size changes
  window.addEventListener("resize", updateDisplayHolds);
}

// Check if a hold is selected
const isHoldSelected = (index) => {
  return props.selectedHolds.some((h) => h.index === index);
};

// Get the type of a selected hold
const selectedHoldType = (index) => {
  if (props.editMode) return "";
  const hold = props.selectedHolds.find((h) => h.index === index);
  return hold ? `hold-${hold.type}` : "";
};

// Toggle hold selection
const toggleHold = (index) => {
  if (props.editMode) return;

  let newSelectedHolds = [...props.selectedHolds];

  const existingIndex = newSelectedHolds.findIndex((h) => h.index === index);

  if (existingIndex !== -1) {
    // If already selected, update the type or remove if it's the same type
    if (newSelectedHolds[existingIndex].type === currentHoldType.value) {
      newSelectedHolds.splice(existingIndex, 1);
    } else {
      newSelectedHolds[existingIndex].type = currentHoldType.value;
    }
  } else {
    // Add new hold
    newSelectedHolds.push({
      index,
      type: currentHoldType.value,
    });
  }

  emit("update:selectedHolds", newSelectedHolds);
};

// Handle click on the image to add a new hold
const handleImageClick = (event) => {
  if (!props.editMode) return;

  // Get click coordinates relative to the image
  const rect = event.target.getBoundingClientRect();
  const pixelX = event.clientX - rect.left;
  const pixelY = event.clientY - rect.top;

  // Convert to relative coordinates (0-1)
  const relativeX = pixelX / imageWidth.value;
  const relativeY = pixelY / imageHeight.value;

  // Add new hold at click position (store relative coordinates)
  const newHold = {
    x: relativeX,
    y: relativeY,
  };

  // Add to holds array
  holds.value.push(newHold);

  // Update display holds
  updateDisplayHolds();

  // Emit update event with the updated holds array
  emit("update:holdPositions", holds.value);
};

// Remove a hold
const removeHold = (index) => {
  if (!props.editMode) return;

  // Remove the hold
  holds.value.splice(index, 1);
  displayHolds.value.splice(index, 1);

  // Emit update event with the updated holds array
  emit("update:holdPositions", holds.value);

  // Update selected holds if needed
  if (props.selectedHolds.some((h) => h.index === index)) {
    const newSelectedHolds = props.selectedHolds
      .filter((h) => h.index !== index)
      .map((h) => {
        // Adjust indices for holds after the removed one
        if (h.index > index) {
          return { ...h, index: h.index - 1 };
        }
        return h;
      });

    emit("update:selectedHolds", newSelectedHolds);
  }
};

// Save hold positions
const saveHoldPositions = () => {
  // Emit update event with relative positions
  emit("update:holdPositions", holds.value);

  // Exit edit mode if needed
  if (props.editMode) {
    emit("update:editMode", false);
  }
};

// Cancel edit and revert to original positions
const cancelEdit = () => {
  // Revert to original positions
  holds.value = [...originalHoldPositions.value];
  updateDisplayHolds();

  // Exit edit mode
  emit("update:editMode", false);
};

// Clean up event listeners
onMounted(() => {
  // If the image is already loaded, initialize holds
  const img = sprayWallRef.value?.querySelector("img");
  if (img && img.complete) {
    initializeHolds();
  }
});

// Clean up event listeners on unmount
onUnmounted(() => {
  window.removeEventListener("resize", updateDisplayHolds);
});
</script>

<style lang="scss" scoped>
.spray-wall-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spray-wall {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;

  &-image {
    display: block;
    border-radius: var(--border-radius);
    width: 100%;
    height: auto;
    cursor: default;

    &:hover {
      cursor: pointer;
    }
  }
}

.hold {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1) !important;
    border-color: white;
  }

  &-selected {
    border-width: 3px;
  }

  &-edit {
    background-color: rgba(255, 255, 255, 0.5);
    border-color: #ff5722;
    border-width: 2px;

    &:hover {
      background-color: rgba(255, 87, 34, 0.5);
    }
  }

  &-start {
    background-color: rgba(76, 175, 80, 0.6);
    border-color: #4caf50;
  }

  &-hand {
    background-color: rgba(33, 150, 243, 0.6);
    border-color: #2196f3;
  }

  &-feet {
    background-color: rgba(255, 152, 0, 0.6);
    border-color: #ff9800;
  }

  &-top {
    background-color: rgba(233, 30, 99, 0.6);
    border-color: #e91e63;
  }
}

.hold-type-selector {
  margin-top: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  width: 100%;

  .hold-type-title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .hold-type-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .hold-type-button {
      flex: 1;
      min-width: 70px;

      &.active {
        &[class*="start"] {
          background-color: #4caf50;
        }

        &[class*="hand"] {
          background-color: #2196f3;
        }

        &[class*="feet"] {
          background-color: #ff9800;
        }

        &[class*="top"] {
          background-color: #e91e63;
        }
      }
    }
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .hold {
    &:hover {
      transform: translate(-50%, -50%) !important;
    }
  }

  .hold-type-buttons {
    .hold-type-button {
      padding: 0.75rem 0.5rem;
    }
  }
}
</style>
