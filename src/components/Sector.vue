<template>
    <div class="sector-wrapper">
        <svg viewBox="0 0 100 100" class="sector">
            <circle class="bg" cx="50" cy="50" r="45" />
            <circle class="meter" cx="50" cy="50" r="45" />
        </svg>
        <div class="title">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
const props = defineProps<{
    deg: number;
    color: string;
}>();

// 周长 2 * pi * r
const circleLen = 282;
const offset = computed(() => ((360 - props.deg) / 360) * circleLen);
const strokeColor = computed(() => props.color);
</script>

<style scoped lang="less">
.sector-wrapper {
    position: relative;

    .sector {
        .bg {
            fill: rgba(255, 255, 255, 0.5);
            stroke-width: 5px;
            stroke: rgb(245, 245, 245);
        }

        .meter {
            fill: none;
            stroke-width: 5px;
            stroke-linecap: round;
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
            stroke: v-bind(strokeColor);
            stroke-dasharray: 282;
            stroke-dashoffset: v-bind(offset);
            transition: stroke-dashoffset 0.5s;
        }
    }

    .title {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
}
</style>
