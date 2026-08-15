<template>
  <AssignmentCard
    :job-type="jobType"
    :group-of-work="groupOfWork"
    :date="date"
    :sensus-ref="sensusRef"
    :blocks="blocks"
    :progress-status="progressStatus"
    :show-photo="false"
    :show-add-to-plan="true"
    @view-detail="$emit('view')"
    @add-to-plan="$emit('add-to-plan')"
  />
</template>

<script setup>
import AssignmentCard from '../../shared/AssignmentCard.vue'

defineProps({
  jobType: { type: String, default: '' },
  groupOfWork: { type: String, default: '' },
  date: { type: String, default: '' },
  sensusRef: { type: String, default: '' },
  blocks: { type: Array, default: () => [] },
  photo: { type: String, default: '' },
  extraPhotos: { type: Number, default: 0 },
  progressStatus: { type: String, default: '' }
})

defineEmits(['view', 'add-to-plan'])
</script>
