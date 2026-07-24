<template>
  <AssignmentCard
    :job-type="jobType"
    :group-of-work="groupOfWork"
    :date="date"
    :sensus-ref="sensusRef"
    :blocks="blocks"
    :photo="photo"
    :extra-photos="extraPhotos"
    @view-detail="$emit('view')"
    @add-to-plan="$emit('plan')"
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
  extraPhotos: { type: Number, default: 0 }
})

defineEmits(['view', 'plan'])
</script>
