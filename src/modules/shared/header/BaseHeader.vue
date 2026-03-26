<template>
  <header class="header">
    <div class="header__title">
      <p class="header__eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
    </div>

    <div class="header__actions">
      <button class="header__button" type="button" aria-label="Notifications">
        <span class="header__button-icon">
          <BaseIcon name="notifications" />
        </span>
        <span class="header__button-badge">{{ notifications }}</span>
      </button>

      <span class="header__divider" aria-hidden="true"></span>

      <div class="header__user">
        <div class="header__avatar">{{ user.initials }}</div>
        <div class="header__user-copy">
          <strong>{{ user.name }}</strong>
          <span>{{ user.role }}</span>
        </div>
        <button class="header__chevron" type="button" aria-label="Open user menu">
          <BaseIcon name="chevron-down" size="14" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import BaseIcon from '../icon'

defineProps({
  eyebrow: {
    type: String,
    default: 'Dashboard'
  },
  title: {
    type: String,
    required: true
  },
  notifications: {
    type: [Number, String],
    default: 0
  },
  user: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.header {
  min-height: 60px;
  padding: 0 20px 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.header__title {
  min-width: 0;
}

.header__eyebrow {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.header h1 {
  margin: 0;
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
}

.header__button {
  position: relative;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  display: inline-grid;
  place-items: center;
  color: var(--text-muted);
}

.header__button-icon {
  width: 17px;
  height: 17px;
}

.header__button-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b91c1c;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
}

.header__divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

.header__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #15803d;
  color: #fff;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.header__user-copy {
  display: grid;
  gap: 1px;
  justify-items: center;
  text-align: center;
}

.header__user-copy strong {
  font-size: 15px;
  line-height: 18px;
  font-weight: 700;
}

.header__user-copy span {
  font-size: 11px;
  line-height: 14px;
  color: var(--text-muted);
}

.header__chevron {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  margin-left: 2px;
  width: 14px;
  height: 14px;
  color: var(--text);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
}

.header__chevron svg {
  stroke-width: 1.9;
}

@media (max-width: 720px) {
  .header {
    min-height: 60px;
    padding: 12px 18px;
    align-items: flex-start;
    flex-direction: column;
  }

  .header__actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>