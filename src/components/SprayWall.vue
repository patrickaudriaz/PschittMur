<template>
  <div class="spray-wall-container">
    <div
      class="spray-wall"
      ref="sprayWallRef"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @wheel="handleWheel"
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
          @click="editMode && !isMoving && handleImageClick($event)"
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
            { 'hold-view-only': viewOnly },
            selectedHoldType(index),
          ]"
          :style="{
            left: `${hold.pixelX}px`,
            top: `${hold.pixelY}px`,
            width: `${hold.size}px`,
            height: `${hold.size}px`,
            transform: 'translate(-50%, -50%)',
            display: shouldDisplayHold(index) ? 'block' : 'none',
          }"
          @click.stop="
            !viewOnly &&
              (editMode ? removeHold(index) : cycleHoldType(index, $event))
          "
          @touchend.stop="handleHoldTouchEnd(index, $event)"
        ></div>

        <!-- Hold type indicator -->
        <div
          v-for="(indicator, index) in holdTypeIndicators"
          :key="`indicator-${indicator.id}`"
          class="hold-type-indicator"
          :style="{
            left: `${indicator.x}px`,
            top: `${indicator.y}px`,
          }"
        >
          {{ indicator.text }}
        </div>
      </div>

      <!-- Fullscreen button -->
      <button
        class="fullscreen-button"
        @click="toggleFullscreen"
        title="Toggle fullscreen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            v-if="isFullscreen"
            d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
          ></path>
          <path v-else d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
        </svg>
      </button>

      <!-- Show all holds toggle button (only visible in non-edit mode) -->
      <button
        v-if="!editMode"
        class="show-all-holds-button"
        @click="showAllHolds = !showAllHolds"
        :title="showAllHolds ? 'Show route holds' : 'Show all holds'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <!-- Show eye-off when showAllHolds is true (showing all holds) -->
          <g v-if="showAllHolds">
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
            ></path>
            <path
              d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
            ></path>
            <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </g>
          <!-- Show eye when showAllHolds is false (hiding unused holds) -->
          <g v-else>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </g>
        </svg>
      </button>
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
  viewOnly: {
    type: Boolean,
    default: false,
  },
  isCreateMode: {
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

// Define the exact order of hold types for cycling
const orderedHoldTypesForCycling = [
  routeStore.holdTypes.HAND, // Hand first
  routeStore.holdTypes.FEET, // Feet second
  routeStore.holdTypes.START, // Start third
  routeStore.holdTypes.TOP, // Top fourth
  null, // Unselected last
];

// State
const sprayWallRef = ref(null);
const holds = ref([]);
const displayHolds = ref([]);
const currentHoldType = ref(routeStore.holdTypes.HAND);
const sprayWallImage = "/spraywall.jpg";
const defaultHoldSize = ref(20); // Default size for all holds
const originalHoldPositions = ref([]);
const imageWidth = ref(0);
const imageHeight = ref(0);
const showAllHolds = ref(props.isCreateMode);
const previousShowAllHoldsState = ref(props.isCreateMode); // Store previous state when toggling edit mode
const showAllHoldsInitialized = ref(false);

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
const isMoving = ref(false);
const lastMoveTime = ref(0);
const movementThreshold = 10;
const touchCooldownPeriod = 150;

// Fullscreen state
const isFullscreen = ref(false);

// Hold type indicators
const holdTypeIndicators = ref([]);

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
      // Store the current showAllHolds value before entering edit mode
      previousShowAllHoldsState.value = showAllHolds.value;
      // Always show all holds in edit mode
      showAllHolds.value = true;
    } else {
      // Restore previous showAllHolds state when exiting edit mode
      showAllHolds.value = previousShowAllHoldsState.value;
    }
  }
);

watch(
  () => props.isCreateMode,
  (newIsCreateMode) => {
    // Only set the initial state when the component is first mounted
    // Don't update it on subsequent changes to allow manual toggling
    if (newIsCreateMode !== undefined && !showAllHoldsInitialized.value) {
      showAllHolds.value = newIsCreateMode;
      showAllHoldsInitialized.value = true;
    }
  },
  { immediate: true } // Run immediately when component is created
);

// Touch gesture handlers
const handleTouchStart = (event) => {
  if (event.touches.length === 1) {
    // Single touch - prepare for panning
    touchStartX.value = event.touches[0].clientX;
    touchStartY.value = event.touches[0].clientY;
    isMoving.value = false;

    // For a new touch, reset the last move time to allow immediate selection
    // if this turns out to be a tap rather than a pan
    lastMoveTime.value = 0;
  } else if (event.touches.length === 2) {
    // Pinch gesture - prepare for zooming
    isPinching.value = true;
    isMoving.value = true;
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
    const deltaX = touchX - touchStartX.value;
    const deltaY = touchY - touchStartY.value;

    // Check if we've moved enough to consider it a pan
    if (
      Math.abs(deltaX) > movementThreshold ||
      Math.abs(deltaY) > movementThreshold
    ) {
      isMoving.value = true;
      lastMoveTime.value = Date.now(); // Update the last move time
    }

    // Update pan position (adjusted for zoom)
    panX.value += deltaX / zoom.value;
    panY.value += deltaY / zoom.value;

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

    // Update last move time for pinch gestures too
    lastMoveTime.value = Date.now();

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
      // Keep isMoving true for a short time to prevent accidental hold selection
      setTimeout(() => {
        isMoving.value = false;
      }, touchCooldownPeriod);
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
  } else if (isMoving.value) {
    // For single touch movement, update the last move time
    lastMoveTime.value = Date.now();

    // Reset isMoving after a delay
    setTimeout(() => {
      isMoving.value = false;
    }, touchCooldownPeriod);
  } else {
    // For simple taps, reset immediately to ensure hold cycling works
    isMoving.value = false;
    // For simple taps, we don't update lastMoveTime, so selection can happen immediately
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
  defaultHoldSize.value = Math.min(imageWidth.value, imageHeight.value) * 0.03; // 3% of the image size

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
  defaultHoldSize.value = Math.min(imageWidth.value, imageHeight.value) * 0.03; // 3% of the image size

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

// Cycle through hold types
const cycleHoldType = (index, event) => {
  // Don't allow cycling if in viewOnly mode, editMode, or during pinch/move gestures
  // Also check if we're within the cooldown period after movement
  if (
    props.viewOnly ||
    props.editMode ||
    isPinching.value ||
    isMoving.value ||
    (lastMoveTime.value > 0 &&
      Date.now() - lastMoveTime.value < touchCooldownPeriod)
  ) {
    return;
  }

  let newSelectedHolds = [...props.selectedHolds];
  const existingIndex = newSelectedHolds.findIndex((h) => h.index === index);

  let nextTypeIndex = 0;

  if (existingIndex !== -1) {
    // Find current type in the order
    const currentType = newSelectedHolds[existingIndex].type;

    // Find the current type in our ordered array
    let currentTypeIndex = orderedHoldTypesForCycling.findIndex(
      (type) => type === currentType
    );

    // If the current type isn't found in our ordered array (which might happen if the data is inconsistent),
    // default to the first type
    if (currentTypeIndex === -1) {
      currentTypeIndex = 0;
    }

    // Get next type in the cycle
    nextTypeIndex = (currentTypeIndex + 1) % orderedHoldTypesForCycling.length;

    if (orderedHoldTypesForCycling[nextTypeIndex] === null) {
      // Remove the hold if cycling to "unselected"
      newSelectedHolds.splice(existingIndex, 1);
      showHoldTypeIndicator(index, "Unselected");
    } else {
      // Update to the next type
      newSelectedHolds[existingIndex].type =
        orderedHoldTypesForCycling[nextTypeIndex];
      showHoldTypeIndicator(index, orderedHoldTypesForCycling[nextTypeIndex]);
    }
  } else {
    // Add new hold with first type in the cycle (hand)
    newSelectedHolds.push({
      index,
      type: orderedHoldTypesForCycling[0],
    });
    showHoldTypeIndicator(index, orderedHoldTypesForCycling[0]);
  }

  // Force a small delay to ensure the DOM updates properly on mobile
  setTimeout(() => {
    emit("update:selectedHolds", newSelectedHolds);
  }, 100); // Increased from 50ms to 100ms for better reliability on mobile
};

// Show hold type indicator
const showHoldTypeIndicator = (index, type) => {
  if (!displayHolds.value[index]) return;

  const hold = displayHolds.value[index];
  const displayText =
    type === null || type === "unselected"
      ? "unselected"
      : type.charAt(0).toUpperCase() + type.slice(1);

  // Limit the number of active indicators to improve performance
  // Remove oldest indicators if we have too many
  if (holdTypeIndicators.value.length >= 5) {
    // Increased from 3 to 5
    holdTypeIndicators.value.shift();
  }

  // Check if we're on mobile (using a simple width check)
  const isMobile = window.innerWidth <= 768;

  // Create new indicator with unique ID
  const indicator = {
    id: Date.now(), // Unique ID for this indicator
    x: hold.pixelX,
    y: hold.pixelY - (isMobile ? 20 : 30), // Position closer on mobile
    text: displayText,
  };

  // Add to indicators array
  holdTypeIndicators.value.push(indicator);

  // Remove indicator after longer time on mobile
  const displayDuration = isMobile ? 500 : 500; // 0.5 seconds

  setTimeout(() => {
    const index = holdTypeIndicators.value.findIndex(
      (i) => i.id === indicator.id
    );
    if (index !== -1) {
      holdTypeIndicators.value.splice(index, 1);
    }
  }, displayDuration);
};

// Handle click on the image to add a new hold
const handleImageClick = (event) => {
  if (!props.editMode) {
    // In view mode, clicking on the image should do nothing
    return;
  }

  // Don't add holds if we're within the cooldown period after movement
  if (
    lastMoveTime.value > 0 &&
    Date.now() - lastMoveTime.value < touchCooldownPeriod
  )
    return;

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

  // Don't remove holds if we're within the cooldown period after movement
  if (
    lastMoveTime.value > 0 &&
    Date.now() - lastMoveTime.value < touchCooldownPeriod
  )
    return;

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

// Toggle fullscreen
const toggleFullscreen = () => {
  const container = sprayWallRef.value;

  if (!document.fullscreenElement) {
    // Enter fullscreen
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      /* Safari */
      container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
      /* IE11 */
      container.msRequestFullscreen();
    }
    isFullscreen.value = true;

    // Reset zoom and pan when entering fullscreen
    zoom.value = 1;
    panX.value = 0;
    panY.value = 0;
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
    isFullscreen.value = false;
  }
};

// Listen for fullscreen change events
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;

  // Reset zoom and pan when exiting fullscreen
  if (!isFullscreen.value) {
    resetZoom();
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

// Handle mouse wheel for panning
const handleWheel = (event) => {
  // Only allow wheel panning in fullscreen mode
  if (!isFullscreen.value) return;

  // Prevent default scrolling behavior
  event.preventDefault();

  // Pan vertically with wheel
  const scrollAmount = event.deltaY / zoom.value;
  panY.value -= scrollAmount * 0.5; // Adjust sensitivity as needed
};

// Handle hold touch end
const handleHoldTouchEnd = (index, event) => {
  // Prevent default to avoid any browser handling
  event.preventDefault();
  event.stopPropagation();

  // Don't do anything in view only mode
  if (props.viewOnly) return;

  // Check if we can interact with the hold
  const canInteract = !isPinching.value && !isMoving.value;

  // Only apply cooldown check if we've actually moved
  const isCooldownOver =
    lastMoveTime.value === 0 ||
    Date.now() - lastMoveTime.value >= touchCooldownPeriod;

  if (canInteract && isCooldownOver) {
    // Handle the hold based on mode
    if (props.editMode) {
      removeHold(index);
    } else {
      cycleHoldType(index, event);
    }
  }
};

// Determine if a hold should be displayed
const shouldDisplayHold = (index) => {
  // In edit mode, always show all holds
  if (props.editMode) return true;

  // If showAllHolds is enabled, show all holds regardless of mode or selection
  if (showAllHolds.value) return true;

  // Otherwise, only show selected holds
  return isHoldSelected(index);
};

// Clean up event listeners
onMounted(() => {
  // If the image is already loaded, initialize holds
  const img = sprayWallRef.value?.querySelector("img");
  if (img && img.complete) {
    initializeHolds();
  }

  // Initialize showAllHolds based on isCreateMode
  showAllHolds.value = props.isCreateMode;
  previousShowAllHoldsState.value = props.isCreateMode;
  showAllHoldsInitialized.value = true;

  // Add fullscreen change event listener
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);
});

// Clean up event listeners on unmount
onUnmounted(() => {
  window.removeEventListener("resize", updateDisplayHolds);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  document.removeEventListener(
    "webkitfullscreenchange",
    handleFullscreenChange
  );
  document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
  document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
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
    filter: saturate(0.2) brightness(0.9) blur(0.1px); /* Reduce saturation to 60% and slightly increase contrast */

    &:hover {
      cursor: pointer;
    }
  }
}

/* Add fullscreen specific styles */
:fullscreen .spray-wall,
:-webkit-full-screen .spray-wall,
:-moz-full-screen .spray-wall,
:-ms-fullscreen .spray-wall {
  height: 100vh;
  overflow: auto;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

:fullscreen .spray-wall-content,
:-webkit-full-screen .spray-wall-content,
:-moz-full-screen .spray-wall-content,
:-ms-fullscreen .spray-wall-content {
  height: auto;
  max-height: 100vh;
  overflow: visible;
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

  &-view-only {
    cursor: default;

    &:hover {
      transform: translate(-50%, -50%) !important;
      border-color: rgba(0, 0, 0, 0.5);
      filter: none;
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

.hold-type-indicator {
  position: absolute;
  background-color: rgba(
    0,
    0,
    0,
    0.8
  ); /* Darker background for better visibility */
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  transform: translate(
    -50%,
    0
  ); /* Adjust transform to be directly above hold */
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.fullscreen-button,
.show-all-holds-button {
  position: absolute;
  top: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s, box-shadow 0.2s;
  padding: 0; /* Remove padding to allow icon to fill the button */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); /* Add drop shadow */

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4); /* Enhanced shadow on hover */
  }

  svg {
    width: 25px;
    height: 25px;
    filter: drop-shadow(
      0 1px 1px rgba(0, 0, 0, 0.3)
    ); /* Add subtle shadow to the icon */
  }
}

.fullscreen-button {
  right: 10px;
}

.show-all-holds-button {
  left: 10px;
}

/* Simple tooltip for buttons */
.fullscreen-button::after,
.show-all-holds-button::after {
  content: attr(title);
  position: absolute;
  bottom: -30px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.fullscreen-button::after {
  right: 0;
}

.show-all-holds-button::after {
  left: 0;
}

.fullscreen-button:hover::after,
.show-all-holds-button:hover::after {
  opacity: 1;
  visibility: visible;
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

  .fullscreen-button,
  .show-all-holds-button {
    width: 30px;
    height: 30px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* Slightly smaller shadow for mobile */

    svg {
      width: 15px;
      height: 15px;
    }
  }

  .hold-type-indicator {
    font-size: 8px;
    padding: 2px 4px;
  }
}
</style>
