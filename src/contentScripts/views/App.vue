<template>
    <div
        class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em flex-col w-40"
    >
        <Clock
            class="w-20 h-20 mx-auto"
            :left-seconds="leftSeconds"
            :total-seconds="totalSeconds"
            :status="clockStatus"
            :type="clockType"
            @click="toggle"
        />
        <div class="text-center text-base font-medium">{{ clockMsg }}</div>
    </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import 'virtual:windi.css';
import { useClockStatus } from './app';

const {
    next,
    clockStatus,
    clockType,
    clearTimer,
    leftSeconds,
    onTick,
    toggle,
    totalSeconds,
} = useClockStatus();
const clockMsg = computed(() => {
    switch (clockType.value) {
        case 'task':
            return 'Time to focus!';
        case 'break':
            return 'Time for a break!';
        case 'longBreak':
            return 'Time for a long break!';
        default:
            return '';
    }
});

const { pause, resume } = useIntervalFn(onTick, 1000);

// 切换计时状态
watch(
    clockStatus,
    (val) => {
        if (val === 'idle') {
            pause();
        } else {
            resume();
        }

        clearTimer();
    },
    { immediate: true }
);

// 计时结束，切换任务状态
watch(leftSeconds, (val) => {
    if (val > 0) {
        return;
    }

    next();
});
</script>
