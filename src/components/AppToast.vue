<template>
    <Teleport to="body">
        <div class="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 items-end pointer-events-none">
            <TransitionGroup name="toast">
                <div
                    v-for="t in toasts"
                    :key="t.id"
                    class="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm max-w-xs w-full"
                    :style="cardStyle(t.type)">
                    <span class="text-base leading-none mt-0.5 flex-shrink-0" :style="{ color: accentVar(t.type) }">
                        {{ icons[t.type] || icons.info }}
                    </span>
                    <span class="flex-1 leading-snug font-medium" :style="{ color: 'var(--text)' }">{{ t.message }}</span>
                    <button
                        type="button"
                        class="flex-shrink-0 border-0 bg-transparent cursor-pointer leading-none p-0 transition-opacity hover:opacity-100 opacity-40"
                        :style="{ color: 'var(--text-muted)' }"
                        aria-label="Dismiss"
                        @click="dismiss(t.id)">
                        &times;
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup>
import { useToast } from '../utils/toast'

const { toasts, dismiss } = useToast()

const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
}

const ACCENTS = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: 'var(--warning)',
    info: 'var(--info)'
}

function accentVar(type) {
    return ACCENTS[type] || ACCENTS.info
}

function cardStyle(type) {
    const accent = accentVar(type)
    return {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${accent}`,
        boxShadow: 'var(--shadow)'
    }
}
</script>

<style scoped>
.toast-enter-active {
    transition: all 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
    transition: all 200ms ease-in;
}
.toast-enter-from {
    opacity: 0;
    transform: translateX(32px);
}
.toast-leave-to {
    opacity: 0;
    transform: translateX(32px);
}
.toast-move {
    transition: transform 240ms ease;
}
</style>
