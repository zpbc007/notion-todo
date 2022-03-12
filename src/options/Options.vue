<template>
    <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
        <Clock
            class="max-w-3xl max-h-3xl mx-auto"
            :left-seconds="leftSeconds"
            :total-seconds="totalSeconds"
            :status="curTask?.status || 'idle'"
            :type="curTask?.type || 'task'"
            is-options
            @click="toggleTask"
        />
        <div class="text-center text-8xl font-medium">{{ clockMsg }}</div>
    </main>
</template>

<script setup lang="ts">
import { useTaskStore } from '~/hooks/useTaskStore';

const { curTask, toggleTask, leftSeconds, totalSeconds, clockMsg } =
    useTaskStore(false);
</script>
