<template>
    <div
        class="fixed right-0 bottom-10 m-5 z-100 flex font-sans select-none leading-1em flex-col w-50"
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
import { useTaskStore } from '~/hooks/useTaskStore';
import 'virtual:windi.css';

const { curTask, toggleTask, leftSeconds, totalSeconds, clockMsg } =
    useTaskStore();
</script>
