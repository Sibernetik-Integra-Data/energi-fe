<template>
    <!-- Card Section: Summary stats for Pekerja -->
    <div class="pekerja-cards">
        <div class="grid grid-cols-4 gap-4 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">

            <!-- Total Pekerja Card -->
            <div class="pekerja-stat-card">
                <div class="flex items-start justify-between flex-1">
                    <!-- Left: label + count -->
                    <div class="flex flex-col justify-between h-full">
                        <p class="text-sm font-normal tracking-[-0.15px] m-0 text-(--text-muted)">
                            Total Pekerja
                        </p>
                        <p class="text-[30px] font-semibold tracking-[0.40px] leading-[36px] m-0 text-(--text)">
                            {{ total }}
                        </p>
                    </div>
                    <!-- Right: icon badge -->
                    <div class="bg-[#b8a44c] rounded-3xl w-14 h-14 flex items-center justify-center shrink-0">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
defineProps({
    total: {
        type: Number,
        default: 0
    }
})
</script>

<style scoped>
.pekerja-cards {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 16px;
}

.pekerja-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    height: 142px;
}
</style>
