<template>
    <div
        class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em flex-col w-40"
    >
        <Clock
            class="w-20 h-20 mx-auto"
            :left-seconds="leftSeconds"
            :total-seconds="totalSeconds"
            :status="curTask?.status || 'idle'"
            :type="curTask?.type || 'task'"
            @click="toggleTask"
        />
        <div class="text-center text-base font-medium">{{ clockMsg }}</div>
    </div>
</template>

<script setup lang="ts">
import { useTaskStore } from './store';
import 'virtual:windi.css';

const { curTask, startTask, stopTask, leftSeconds, totalSeconds } =
    useTaskStore();

const clockMsg = computed(() => {
    if (!curTask.value) {
        return 'Time to focus!';
    }

    switch (curTask.value.type) {
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

const toggleTask = () => {
    if (!curTask.value) {
        return;
    }

    if (curTask.value.status === 'idle') {
        return startTask();
    }
    if (curTask.value.status === 'doing') {
        return stopTask();
    }
};
</script>
