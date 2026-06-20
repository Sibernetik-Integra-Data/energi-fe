<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <template v-if="name === 'dashboard'">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="4" rx="1.5" />
      <rect x="11.5" y="9.5" width="6" height="8" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
    </template>

    <template v-else-if="name === 'sensus'">
      <path d="M4 14.5V5.5" />
      <path d="M4 14.5H16" />
      <path d="M6.5 11.5L9.2 8.8L11.3 10.9L15 7.5" />
      <circle cx="6.5" cy="11.5" r="0.8" />
      <circle cx="9.2" cy="8.8" r="0.8" />
      <circle cx="11.3" cy="10.9" r="0.8" />
      <circle cx="15" cy="7.5" r="0.8" />
    </template>

    <template v-else-if="name === 'cleaning'">
      <path d="M5 14.5L13.2 6.3" />
      <path d="M10 4.5L15.5 10" />
      <path d="M4.5 15.5L8.5 11.5" />
      <path d="M13.4 8.5L15.5 6.4" />
      <path d="M7 7L13 13" />
    </template>

    <template v-else-if="name === 'fertilize'">
      <path d="M10 16.5C10 16.5 15 14 15 8.5C15 6.3 13.2 4.5 11 4.5C8.2 4.5 6.5 6.4 6.5 9C6.5 13 10 16.5 10 16.5Z" />
      <path d="M6.6 10.4C8.2 10.4 9.7 9.7 11 8.4" />
    </template>

    <template v-else-if="name === 'harvest'">
      <path d="M4.8 7.5H15.2" />
      <path d="M6.2 7.5L7 14.5H13L13.8 7.5" />
      <path d="M7.5 5.5C8.2 4.5 9 4 10 4C11 4 11.8 4.5 12.5 5.5" />
      <path d="M7 10H13" />
    </template>

    <template v-else-if="name === 'notifications'">
      <path d="M10 4.5C7.5 4.5 6 6.4 6 8.6V11.2L4.8 13.2H15.2L14 11.2V8.6C14 6.4 12.5 4.5 10 4.5Z" />
      <path d="M8.7 15C8.9 15.6 9.4 16 10 16C10.6 16 11.1 15.6 11.3 15" />
    </template>

    <template v-else-if="name === 'settings'">
      <path d="M10 6.2L11.2 4.5L12.8 5.2L13 7.3L14.8 8.2L14.8 9.8L13 10.7L12.8 12.8L11.2 13.5L10 11.8L8.8 13.5L7.2 12.8L7 10.7L5.2 9.8L5.2 8.2L7 7.3L7.2 5.2L8.8 4.5L10 6.2Z" />
      <circle cx="10" cy="9" r="1.9" />
    </template>

    <template v-else-if="name === 'database'">
      <ellipse cx="10" cy="6.2" rx="4.8" ry="2.2" />
      <path d="M5.2 6.2V10.8C5.2 12 7.3 13.1 10 13.1C12.7 13.1 14.8 12 14.8 10.8V6.2" />
      <path d="M5.2 10.8V15.4C5.2 16.6 7.3 17.7 10 17.7C12.7 17.7 14.8 16.6 14.8 15.4V10.8" />
    </template>

    <template v-else-if="name === 'users'">
      <circle cx="7.5" cy="7" r="2.1" />
      <circle cx="12.8" cy="8" r="1.7" />
      <path d="M4.8 14.3C4.8 12.3 6.4 10.7 8.4 10.7C10.4 10.7 12 12.3 12 14.3" />
      <path d="M10.7 14.1C10.9 12.8 11.9 11.7 13.3 11.7C14.7 11.7 15.8 12.8 15.8 14.1" />
    </template>

    <template v-else-if="name === 'logo'">
      <path d="M10 4.8V14.2" stroke="#fff" />
      <path d="M10 10.2C10 8.2 11.6 6.6 13.6 6.6C12.9 8.7 11.5 9.8 10 10.2Z" stroke="#fff" />
      <path d="M10 8.9C8.3 8.9 6.9 7.6 6.4 5.6C8.3 5.7 9.5 6.6 10 8.9Z" stroke="#fff" />
      <path d="M7.2 12.8H12.8" stroke="#fff" />
      <path d="M8.5 14.2H11.5" stroke="#fff" />
    </template>

    <template v-else-if="name === 'location-pin'">
      <path d="M10 16.2C10 16.2 14.1 11.8 14.1 8.8C14.1 6.5 12.2 4.6 10 4.6C7.8 4.6 5.9 6.5 5.9 8.8C5.9 11.8 10 16.2 10 16.2Z" />
      <circle cx="10" cy="8.8" r="1.4" fill="none" />
    </template>

    <template v-else-if="name === 'calendar'">
      <rect x="4.2" y="5.3" width="11.6" height="10.3" rx="1.8" />
      <path d="M4.2 8.2H15.8" />
      <path d="M6.4 3.8V6.3" />
      <path d="M13.6 3.8V6.3" />
    </template>

    <template v-else-if="name === 'clock'">
      <circle cx="10" cy="10" r="5.6" />
      <path d="M10 6.9V10.2L12.2 11.6" />
    </template>

    <template v-else-if="name === 'chevron-down'">
      <path d="M5.75 8.5L10 12.5L14.25 8.5" />
    </template>

    <template v-else-if="name === 'logout'">
      <path d="M9.2 4.8H6.8C6.14 4.8 5.6 5.34 5.6 6V14C5.6 14.66 6.14 15.2 6.8 15.2H9.2" />
      <path d="M11 7.4L14.4 10L11 12.6" />
      <path d="M14.2 10H8.4" />
    </template>

    <template v-else-if="name === 'sidebar-collapse'">
      <path d="M12.8 5.5H15.2C15.87 5.5 16.4 6.03 16.4 6.7V13.3C16.4 13.97 15.87 14.5 15.2 14.5H12.8" />
      <path d="M8.2 6.5L4.8 10L8.2 13.5" />
      <path d="M12.2 10H4.8" />
    </template>

    <template v-else-if="name === 'sidebar-expand'">
      <path d="M7.2 5.5H4.8C4.13 5.5 3.6 6.03 3.6 6.7V13.3C3.6 13.97 4.13 14.5 4.8 14.5H7.2" />
      <path d="M11.8 6.5L15.2 10L11.8 13.5" />
      <path d="M7.8 10H15.2" />
    </template>

    <template v-else-if="name === 'chevron-left'">
      <path d="M12.5 5.5L7.5 10L12.5 14.5" />
    </template>

    <template v-else-if="name === 'chevron-right'">
      <path d="M7.5 5.5L12.5 10L7.5 14.5" />
    </template>

    <template v-else-if="name === 'moon'">
      <path d="M16 11.9A6.5 6.5 0 0 1 8.1 4 6.5 6.5 0 1 0 16 11.9Z" />
    </template>

    <template v-else-if="name === 'sun'">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 4.5V3.2" />
      <path d="M10 16.8V15.5" />
      <path d="M4.5 10H3.2" />
      <path d="M16.8 10H15.5" />
      <path d="M6.1 6.1L5.2 5.2" />
      <path d="M14.8 14.8L13.9 13.9" />
      <path d="M13.9 6.1L14.8 5.2" />
      <path d="M5.2 14.8L6.1 13.9" />
    </template>

    <template v-else-if="name === 'profile'">
      <circle cx="10" cy="7" r="2.2" />
      <path d="M4.5 15.5c0-2.6 2.9-4.7 5.5-4.7s5.5 2.1 5.5 4.7" />
    </template>

    <template v-else-if="name === 'key'">
      <circle cx="8" cy="11" r="3" />
      <path d="M10.6 8.4L16 3" />
      <path d="M14.5 4.5L16 6" />
      <path d="M13 6L14.5 7.5" />
    </template>

    <template v-else-if="name === 'camera'">
      <path d="M3.5 7.5C3.5 6.67 4.17 6 5 6h1.5l1-1.5h5l1 1.5H15c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5c-.83 0-1.5-.67-1.5-1.5v-7Z" />
      <circle cx="10" cy="11" r="2.2" />
    </template>

    <template v-else-if="name === 'edit'">
      <path d="M13.5 3.5L16.5 6.5L7 16H4V13L13.5 3.5Z" />
      <path d="M11.5 5.5L14.5 8.5" />
    </template>

    <template v-else-if="name === 'plus'">
      <path d="M10 4.5V15.5" />
      <path d="M4.5 10H15.5" />
    </template>

    <template v-else-if="name === 'x'">
      <path d="M5 5L15 15" />
      <path d="M15 5L5 15" />
    </template>

    <template v-else-if="name === 'filter'">
      <path d="M3.5 5.5H16.5" />
      <path d="M6 10H14" />
      <path d="M8.5 14.5H11.5" />
    </template>

    <template v-else-if="name === 'search'">
      <circle cx="9" cy="9" r="4.5" />
      <path d="M12.5 12.5L16.5 16.5" />
    </template>

    <template v-else-if="name === 'grip'">
      <circle cx="7.5" cy="7" r="1" fill="currentColor" />
      <circle cx="12.5" cy="7" r="1" fill="currentColor" />
      <circle cx="7.5" cy="10" r="1" fill="currentColor" />
      <circle cx="12.5" cy="10" r="1" fill="currentColor" />
      <circle cx="7.5" cy="13" r="1" fill="currentColor" />
      <circle cx="12.5" cy="13" r="1" fill="currentColor" />
    </template>

    <template v-else-if="name === 'gantt'">
      <rect x="3.5" y="5.5" width="7" height="2" rx="1" />
      <rect x="8" y="9.5" width="8.5" height="2" rx="1" />
      <rect x="5" y="13.5" width="6" height="2" rx="1" />
      <path d="M3.5 4.5V16.5" />
    </template>

    <template v-else-if="name === 'list-check'">
      <path d="M9 5.5H16.5" />
      <path d="M9 10H16.5" />
      <path d="M9 14.5H16.5" />
      <polyline points="3.5,5.5 5,7 7.5,4" />
      <polyline points="3.5,10 5,11.5 7.5,8.5" />
      <polyline points="3.5,14.5 5,16 7.5,13" />
    </template>

    <template v-else-if="name === 'truck-delivery'">
      <rect x="2.5" y="4.5" width="9.5" height="8.5" rx="1" />
      <path d="M12 7.5h3.2l2.3 2.5v3h-5.5V7.5z" />
      <circle cx="5.5" cy="15.5" r="1.5" />
      <circle cx="14.5" cy="15.5" r="1.5" />
    </template>

    <template v-else>
      <circle cx="10" cy="10" r="6" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 20
  }
})
</script>

<style scoped>
svg {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>