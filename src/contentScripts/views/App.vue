<template>
    <div
        class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em flex-col"
    >
        <Clock
            :left-seconds="leftSeconds"
            :total-seconds="totalSeconds"
            :status="clockStatus"
            type="break"
            @click="toggle"
        />
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
