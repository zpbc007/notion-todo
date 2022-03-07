<template>
    <div
        class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em flex-col"
    >
        <Clock
            :left-seconds="leftSeconds"
            :total-seconds="totalSeconds"
            :status="clockStatus"
            type="break"
            @click="handleClockClick"
        />
    </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import { ClockStatus, ClockType } from '~/components/clock';
import 'virtual:windi.css';

const Seconds = {
    task: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60,
    // task: 10,
    // break: 3,
    // longBreak: 5,
};
const totalSeconds = ref(Seconds.task);
const timeSlice = ref(0);
// 完成几次番茄钟
const clockTime = ref(0);
const { pause, resume } = useIntervalFn(() => {
    timeSlice.value++;
}, 1000);
const leftSeconds = computed(() => totalSeconds.value - timeSlice.value);

const clockStatus = ref<ClockStatus>('idle');
const clockType = ref<ClockType>('task');

const handleClockClick = () => {
    if (clockStatus.value === 'idle') {
        clockStatus.value = 'doing';
    } else {
        clockStatus.value = 'idle';
    }
};

// 切换计时状态
watch(
    clockStatus,
    (val) => {
        if (val === 'idle') {
            pause();
        } else {
            resume();
        }

        timeSlice.value = 0;
    },
    { immediate: true }
);

// 计时结束，切换任务状态
watch(leftSeconds, (val) => {
    if (val > 0) {
        return;
    }

    clockStatus.value = 'idle';
    if (clockType.value === 'break') {
        clockTime.value++;
    }

    // break => task
    if (clockType.value === 'break' || clockType.value === 'longBreak') {
        totalSeconds.value = Seconds.task;
        return (clockType.value = 'task');
    }

    if (clockTime.value < 3) {
        // task => break
        totalSeconds.value = Seconds.break;
        clockType.value = 'break';
    } else {
        // task => longBreak
        totalSeconds.value = Seconds.longBreak;
        clockType.value = 'longBreak';
        clockTime.value = 0;
    }
});
</script>
