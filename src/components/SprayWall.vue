<template>
  <div class="spray-wall-container">
    <div
      class="spray-wall"
      ref="sprayWallRef"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div
        class="spray-wall-content"
        :style="{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: '0 0',
        }"
      >
        <img
          :src="sprayWallImage"
          alt="Spray Wall"
          class="spray-wall-image"
          @load="initializeHolds"
          @click="editMode && handleImageClick($event)"
          draggable="false"
        />

        <!-- Holds overlay -->
        <div
          v-for="(hold, index) in displayHolds"
          :key="index"
          class="hold"
          :class="[
            { 'hold-selected': isHoldSelected(index) && !editMode },
            { 'hold-edit': editMode },
            selectedHoldType(index),
          ]"
          :style="{
            left: `${hold.pixelX}px`,
            top: `${hold.pixelY}px`,
            width: `${hold.size}px`,
            height: `${hold.size}px`,
            transform: 'translate(-50%, -50%)',
          }"
          @click.stop="editMode ? removeHold(index) : toggleHold(index)"
          @touchend.stop="
            !isPinching && (editMode ? removeHold(index) : toggleHold(index))
          "
        ></div>
      </div>
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

// Zoom and pan state
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);
const initialPinchDistance = ref(0);
const initialZoom = ref(1);
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const isPinching = ref(false);
const lastTouchTime = ref(0);
const lastTapX = ref(0);
const lastTapY = ref(0);

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

// Touch gesture handlers
const handleTouchStart = (event) => {
  if (event.touches.length === 1) {
    // Single touch - prepare for panning
    touchStartX.value = event.touches[0].clientX;
    touchStartY.value = event.touches[0].clientY;

    // Check for double tap
    const now = new Date().getTime();
    const timeDiff = now - lastTouchTime.value;
    const x = event.touches[0].clientX;
    const y = event.touches[0].clientY;
    const distance = Math.sqrt(
      Math.pow(x - lastTapX.value, 2) + Math.pow(y - lastTapY.value, 2)
    );

    if (timeDiff < 300 && distance < 30) {
      // Double tap detected - reset zoom
      resetZoom();
    }

    lastTouchTime.value = now;
    lastTapX.value = x;
    lastTapY.value = y;
  } else if (event.touches.length === 2) {
    // Pinch gesture - prepare for zooming
    isPinching.value = true;
    initialPinchDistance.value = getPinchDistance(event);
    initialZoom.value = zoom.value;
  }
};

const handleTouchMove = (event) => {
  if (event.touches.length === 1 && !isPinching.value) {
    // Panning with one finger
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;

    // Calculate delta movement
    const deltaX = (touchX - touchStartX.value) / zoom.value;
    const deltaY = (touchY - touchStartY.value) / zoom.value;

    // Update pan position
    panX.value += deltaX;
    panY.value += deltaY;

    // Update start position for next move
    touchStartX.value = touchX;
    touchStartY.value = touchY;

    // Prevent default to avoid scrolling the page
    event.preventDefault();
  } else if (event.touches.length === 2) {
    // Pinch zooming with two fingers
    const currentDistance = getPinchDistance(event);
    const scale = currentDistance / initialPinchDistance.value;

    // Calculate new zoom level
    let newZoom = initialZoom.value * scale;

    // Clamp zoom level
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

    // Get pinch center
    const rect = sprayWallRef.value.getBoundingClientRect();
    const pinchCenterX =
      (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
    const pinchCenterY =
      (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;

    // Calculate zoom around pinch center
    const zoomFactor = newZoom / zoom.value;
    const currentPinchCenterX = (pinchCenterX - panX.value) / zoom.value;
    const currentPinchCenterY = (pinchCenterY - panY.value) / zoom.value;

    // Update pan to keep pinch center fixed
    panX.value = pinchCenterX - currentPinchCenterX * newZoom;
    panY.value = pinchCenterY - currentPinchCenterY * newZoom;

    // Update zoom
    zoom.value = newZoom;

    // Prevent default to avoid browser zoom
    event.preventDefault();
  }
};

const handleTouchEnd = (event) => {
  // Only handle touch end for pinch gestures
  if (isPinching.value) {
    // End pinching
    if (event.touches.length < 2) {
      isPinching.value = false;
    }

    // Ensure we're not zoomed out too far
    if (zoom.value < MIN_ZOOM) {
      zoom.value = MIN_ZOOM;
    }

    // Reset pan when at minimum zoom
    if (zoom.value === MIN_ZOOM) {
      panX.value = 0;
      panY.value = 0;
    }

    // Prevent default only for pinch gestures
    event.preventDefault();
  }
};

const getPinchDistance = (event) => {
  const dx = event.touches[0].clientX - event.touches[1].clientX;
  const dy = event.touches[0].clientY - event.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const resetZoom = () => {
  zoom.value = MIN_ZOOM;
  panX.value = 0;
  panY.value = 0;
};

// Update display holds whenever the image size changes
function updateDisplayHolds() {
  const img = sprayWallRef.value?.querySelector("img");
  if (!img) return;

  imageWidth.value = img.clientWidth;
  imageHeight.value = img.clientHeight;

  // Calculate default hold size based on image dimensions
  defaultHoldSize.value = Math.min(imageWidth.value, imageHeight.value) * 0.03; // 5% of the image size

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
  defaultHoldSize.value = Math.min(imageWidth.value, imageHeight.value) * 0.03; // 5% of the image size

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

  // Don't toggle if we're in the middle of a pinch gesture
  if (isPinching.value) return;

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

  // Force a small delay to ensure the DOM updates properly on mobile
  setTimeout(() => {
    emit("update:selectedHolds", newSelectedHolds);
  }, 10);
};

// Handle click on the image to add a new hold
const handleImageClick = (event) => {
  if (!props.editMode) return;

  // Get click coordinates relative to the image
  const rect = event.target.getBoundingClientRect();
  const pixelX = event.clientX - rect.left;
  const pixelY = event.clientY - rect.top;

  // Adjust for zoom and pan
  const adjustedX = (pixelX - panX.value) / zoom.value;
  const adjustedY = (pixelY - panY.value) / zoom.value;

  // Convert to relative coordinates (0-1)
  const relativeX = adjustedX / imageWidth.value;
  const relativeY = adjustedY / imageHeight.value;

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
  touch-action: none; /* Disable browser's default touch actions */

  &-content {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.05s ease-out;
  }

  &-image {
    display: block;
    border-radius: var(--border-radius);
    width: 100%;
    height: auto;
    cursor: default;
    filter: saturate(0.2) contrast(1) blur(0.3px); /* Reduce saturation to 60% and slightly increase contrast */

    &:hover {
      cursor: pointer;
    }
  }
}

.hold {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.5);
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */

  &:hover {
    transform: translate(-50%, -50%) scale(1.1) !important;
    border-color: white;
    filter: brightness(1.2);
  }

  &-selected {
    border-width: 3px;
    border-color: white;
  }

  &-edit {
    background-color: rgba(255, 87, 34, 0.7);
    border-color: white;
    border-width: 2px;

    &:hover {
      background-color: rgba(255, 87, 34, 0.8);
      filter: brightness(1.3);
    }
  }

  /* Make sure type styles override selected styles */
  &-start,
  &.hold-selected.hold-start {
    background-color: rgba(0, 255, 8, 0.6);
    border-color: rgb(244, 100, 100) !important;
    filter: brightness(1.4);
  }

  &-hand,
  &.hold-selected.hold-hand {
    background-color: rgba(0, 13, 255, 0.6);
    border-color: rgb(244, 100, 100) !important;
    filter: brightness(1.4);
  }

  &-feet,
  &.hold-selected.hold-feet {
    background-color: rgba(255, 191, 0, 0.6);
    border-color: rgb(244, 100, 100) !important;
    filter: brightness(1.4);
  }

  &-top,
  &.hold-selected.hold-top {
    background-color: rgba(254, 16, 250, 0.6);
    border-color: rgb(244, 100, 100) !important;
    filter: brightness(1.4);
  }
}

.hold-type-selector {
  padding: 1rem;
  background-color: white;
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
    border-width: 2px;

    &:hover {
      transform: translate(-50%, -50%) !important;
      border: 2px solid rgba(0, 0, 0, 0.5);
    }

    &-selected {
      border-width: 2px;
    }

    /* Ensure type-specific styles override the selected style on mobile */
    &.hold-start,
    &.hold-selected.hold-start {
      background-color: rgba(0, 255, 8, 0.6);
      border-color: rgb(244, 100, 100) !important;
      filter: brightness(1.4);
    }

    &.hold-hand,
    &.hold-selected.hold-hand {
      background-color: rgba(0, 13, 255, 0.6);
      border-color: rgb(244, 100, 100) !important;
      filter: brightness(1.4);
    }

    &.hold-feet,
    &.hold-selected.hold-feet {
      background-color: rgba(255, 191, 0, 0.6);
      border-color: rgb(244, 100, 100) !important;
      filter: brightness(1.4);
    }

    &.hold-top,
    &.hold-selected.hold-top {
      background-color: rgba(254, 16, 250, 0.6);
      border-color: rgb(244, 100, 100) !important;
      filter: brightness(1.4);
    }
  }

  .hold-type-buttons {
    .hold-type-button {
      padding: 0.75rem 0.5rem;
    }
  }
}
</style>
