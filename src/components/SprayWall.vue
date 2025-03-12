<template>
  <div class="spray-wall-container">
    <div class="spray-wall" ref="sprayWallRef">
      <img
        :src="sprayWallImage"
        alt="Spray Wall"
        class="spray-wall-image"
        @load="initializeHolds"
      />

      <!-- Holds overlay -->
      <div
        v-for="(hold, index) in holds"
        :key="index"
        class="hold"
        :class="[
          { 'hold-selected': isHoldSelected(index) },
          selectedHoldType(index),
        ]"
        :style="{
          left: `${hold.x}px`,
          top: `${hold.y}px`,
          width: `${hold.size}px`,
          height: `${hold.size}px`,
        }"
        @click="toggleHold(index)"
      ></div>
    </div>

    <div v-if="selectionMode" class="hold-type-selector">
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
import { onMounted, ref } from "vue";
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
});

// Emits
const emit = defineEmits(["update:selectedHolds"]);

// Store
const routeStore = useRouteStore();
const holdTypes = Object.values(routeStore.holdTypes);

// State
const sprayWallRef = ref(null);
const holds = ref([]);
const currentHoldType = ref(routeStore.holdTypes.HAND);
const sprayWallImage = "/spraywall.jpg";

// Hard-coded holds positions (in a real app, these would be stored in a database)
// These are example positions - you'll need to adjust them based on your actual image
function initializeHolds() {
  // Wait for the image to load to get its dimensions
  const img = sprayWallRef.value.querySelector("img");
  const imgWidth = img.clientWidth;
  const imgHeight = img.clientHeight;

  // Example holds - in a real app, you would map these to the actual holds in your image
  // For now, we'll create a grid of holds as an example
  const holdSize = Math.min(imgWidth, imgHeight) * 0.05; // 5% of the image size
  const rows = 10;
  const cols = 15;
  const marginX = imgWidth * 0.1;
  const marginY = imgHeight * 0.1;
  const stepX = (imgWidth - 2 * marginX) / (cols - 1);
  const stepY = (imgHeight - 2 * marginY) / (rows - 1);

  const generatedHolds = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Add some randomness to make it look more natural
      const randomOffsetX = (Math.random() - 0.5) * stepX * 0.3;
      const randomOffsetY = (Math.random() - 0.5) * stepY * 0.3;

      generatedHolds.push({
        x: marginX + col * stepX + randomOffsetX - holdSize / 2,
        y: marginY + row * stepY + randomOffsetY - holdSize / 2,
        size: holdSize,
      });
    }
  }

  holds.value = generatedHolds;
}

// Check if a hold is selected
const isHoldSelected = (index) => {
  return props.selectedHolds.some((h) => h.index === index);
};

// Get the type of a selected hold
const selectedHoldType = (index) => {
  const hold = props.selectedHolds.find((h) => h.index === index);
  return hold ? `hold-${hold.type}` : "";
};

// Toggle hold selection
const toggleHold = (index) => {
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

// Initialize on mount
onMounted(() => {
  // If the image is already loaded, initialize holds
  const img = sprayWallRef.value?.querySelector("img");
  if (img && img.complete) {
    initializeHolds();
  }
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
    transform: scale(1.1);
    border-color: white;
  }

  &-selected {
    border-width: 3px;
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
      transform: none;
    }
  }

  .hold-type-buttons {
    .hold-type-button {
      padding: 0.75rem 0.5rem;
    }
  }
}
</style>
