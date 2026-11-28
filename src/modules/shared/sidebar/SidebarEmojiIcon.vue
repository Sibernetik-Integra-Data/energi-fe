<template>
  <!-- Ikon menu sidebar: emoji 2D Fluent (prototipe p06). Dekoratif (label menu sudah tertulis). -->
  <span v-if="emoji" :class="['sbe', `sbe--${emoji.motion}`, { 'is-on': active, 'is-just-on': justOn }]"
    :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <svg class="sbe__svg" :width="size" :height="size" :viewBox="emoji.vb" focusable="false" v-html="emoji.body"></svg>
    <span v-if="justOn" class="sbe__sparks"><i></i><i></i><i></i><i></i><i></i><i></i></span>
  </span>
  <!-- Menu baru dari CMS yang belum punya emoji: tetap memakai ikon lama. -->
  <BaseIcon v-else :name="item.icon" :size="size" />
</template>

<script setup>
// SVG berasal dari paket resmi (sidebarEmoji.js, MIT) dan bukan masukan pengguna, jadi v-html aman.
import { computed } from 'vue'
import BaseIcon from '../icon'
import { emojiForItem } from './sidebarEmoji'

const props = defineProps({
  item: { type: Object, required: true },
  size: { type: [Number, String], default: 22 },
  active: { type: Boolean, default: false },
  justOn: { type: Boolean, default: false }
})

const emoji = computed(() => emojiForItem(props.item))
</script>

<style>
/* Animasi ringan ikon menu (prototipe p06): hanya saat diarahkan/fokus dan sekali saat dipilih,
   0,6–0,7 detik, tanpa loop dan tanpa kedip.
   Keputusan pemilik produk (28 Nov 2026): animasi TETAP tampil walau sistem operasi meminta
   "kurangi gerakan". Karena itu tidak ada blok prefers-reduced-motion di sini. */
.sbe { position: relative; display: inline-grid; place-items: center; flex: 0 0 auto; --sbe-kf: sbe-hop; }
.sbe__svg { display: block; transform-origin: 50% 60%; }
.sbe.is-on .sbe__svg { filter: drop-shadow(0 2px 3px rgba(180, 83, 9, 0.25)); }

.sbe--hop { --sbe-kf: sbe-hop; } .sbe--tilt { --sbe-kf: sbe-tilt; } .sbe--flip { --sbe-kf: sbe-flip; }
.sbe--sweep { --sbe-kf: sbe-sweep; } .sbe--grow { --sbe-kf: sbe-grow; } .sbe--sway { --sbe-kf: sbe-sway; }
.sbe--drive { --sbe-kf: sbe-drive; } .sbe--rise { --sbe-kf: sbe-rise; } .sbe--search { --sbe-kf: sbe-search; }
.sbe--wobble { --sbe-kf: sbe-wobble; } .sbe--pop { --sbe-kf: sbe-pop; } .sbe--nod { --sbe-kf: sbe-nod; }
.sbe--drop { --sbe-kf: sbe-drop; } .sbe--puff { --sbe-kf: sbe-puff; } .sbe--spin { --sbe-kf: sbe-spin; }
.sbe--swing { --sbe-kf: sbe-swing; } .sbe--twist { --sbe-kf: sbe-twist; } .sbe--jingle { --sbe-kf: sbe-jingle; }
.sbe--sway .sbe__svg, .sbe--grow .sbe__svg, .sbe--nod .sbe__svg { transform-origin: 50% 95%; }
.sbe--sweep .sbe__svg { transform-origin: 80% 10%; }
.sbe--swing .sbe__svg, .sbe--jingle .sbe__svg { transform-origin: 50% 0%; }
.sbe--drop .sbe__svg { transform-origin: 50% 100%; }

.sidebar-item-button:hover .sbe__svg,
.sidebar-item-button:focus-visible .sbe__svg,
.sbe.is-just-on .sbe__svg { animation: var(--sbe-kf) 0.6s cubic-bezier(0.3, 0.7, 0.4, 1) 1 both; }

.sbe__sparks { position: absolute; inset: -6px; pointer-events: none; }
.sbe__sparks i { position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -2.5px; border-radius: 1px; background: var(--brand); opacity: 0; transform: rotate(45deg); animation: sbe-spark 0.7s ease-out 1 both; }
.sbe__sparks i:nth-child(2n) { background: #16a34a; width: 4px; height: 4px; }
.sbe__sparks i:nth-child(3n) { background: #f59e0b; border-radius: 50%; }
.sbe__sparks i:nth-child(1) { --dx: -16px; --dy: -12px; }
.sbe__sparks i:nth-child(2) { --dx: 15px; --dy: -14px; animation-delay: 0.04s; }
.sbe__sparks i:nth-child(3) { --dx: 18px; --dy: 6px; animation-delay: 0.08s; }
.sbe__sparks i:nth-child(4) { --dx: -17px; --dy: 9px; animation-delay: 0.02s; }
.sbe__sparks i:nth-child(5) { --dx: 2px; --dy: -19px; animation-delay: 0.06s; }
.sbe__sparks i:nth-child(6) { --dx: -3px; --dy: 18px; animation-delay: 0.1s; }

/* Mode kontras tinggi Windows: percikan tidak perlu. */
@media (forced-colors: active) { .sbe__sparks { display: none; } }

@keyframes sbe-spark { 0% { opacity: 0; transform: translate(0, 0) rotate(45deg) scale(0.4); } 25% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(135deg) scale(1); } }
@keyframes sbe-hop { 0%, 100% { transform: translateY(0) scale(1); } 30% { transform: translateY(-5px) scale(1.06); } 55% { transform: translateY(0) scale(0.97, 1.03); } }
@keyframes sbe-tilt { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-10deg); } 65% { transform: rotate(6deg); } }
@keyframes sbe-flip { 0% { transform: perspective(60px) rotateX(0); } 50% { transform: perspective(60px) rotateX(70deg); } 100% { transform: perspective(60px) rotateX(0); } }
@keyframes sbe-sweep { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-14deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-6deg); } }
@keyframes sbe-grow { 0% { transform: scale(1, 1); } 30% { transform: scale(0.9, 0.75); } 65% { transform: scale(1.05, 1.18); } 100% { transform: scale(1, 1); } }
@keyframes sbe-sway { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(8deg); } 65% { transform: rotate(-6deg); } }
@keyframes sbe-drive { 0% { transform: translateX(0); } 40% { transform: translateX(4px); } 55% { transform: translateX(-3px); } 100% { transform: translateX(0); } }
@keyframes sbe-rise { 0% { transform: translateY(3px); opacity: 0.5; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes sbe-search { 0% { transform: translate(0, 0); } 25% { transform: translate(2px, -2px); } 50% { transform: translate(-2px, -1px); } 75% { transform: translate(1px, 2px); } 100% { transform: translate(0, 0); } }
@keyframes sbe-wobble { 0%, 100% { transform: rotate(0) scale(1); } 30% { transform: rotate(-12deg) scale(1.08); } 60% { transform: rotate(9deg); } }
@keyframes sbe-pop { 0% { transform: scale(1); } 40% { transform: scale(1.22); } 70% { transform: scale(0.94); } 100% { transform: scale(1); } }
@keyframes sbe-nod { 0%, 100% { transform: rotate(0); } 35% { transform: rotate(-7deg) translateY(-1px); } 70% { transform: rotate(4deg); } }
@keyframes sbe-drop { 0% { transform: translateY(-7px); opacity: 0.4; } 55% { transform: translateY(0) scale(1.08, 0.88); opacity: 1; } 80% { transform: translateY(-1px) scale(0.97, 1.03); } 100% { transform: translateY(0) scale(1); } }
@keyframes sbe-puff { 0% { transform: translateY(0); } 40% { transform: translateY(-2px) scale(1.04); } 100% { transform: translateY(0); } }
@keyframes sbe-spin { from { transform: rotate(0); } to { transform: rotate(-360deg); } }
@keyframes sbe-swing { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(14deg); } 60% { transform: rotate(-9deg); } 85% { transform: rotate(4deg); } }
@keyframes sbe-twist { 0%, 100% { transform: rotate(0); } 40% { transform: rotate(35deg); } 70% { transform: rotate(-8deg); } }
@keyframes sbe-jingle { 0%, 100% { transform: rotate(0); } 20% { transform: rotate(-12deg); } 40% { transform: rotate(10deg); } 60% { transform: rotate(-7deg); } 80% { transform: rotate(4deg); } }
</style>
