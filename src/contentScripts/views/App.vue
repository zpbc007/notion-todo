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
        <div
            class="bg-white text-gray-800 rounded-full shadow w-max h-min"
            p="x-4 y-2"
            m="y-auto r-2"
            transition="opacity duration-300"
            :class="show ? 'opacity-100' : 'opacity-0'"
        >
            Vitesse WebExt1
        </div>
        <div
            class="flex w-10 h-10 rounded-full shadow cursor-pointer"
            bg="teal-600 hover:teal-700"
            @click="toggle()"
        >
            <pixelarticons-power class="block m-auto text-white text-lg" />
        </div>
        <div class="zp"></div>
    </div>
</template>

<script setup lang="ts">
import { useToggle, useInterval } from '@vueuse/core';
import 'virtual:windi.css';
import { ClockStatus, ClockType } from '~/components/clock';

const [show, toggle] = useToggle(false);
const timeSlice = useInterval(1000);

const totalSeconds = ref(60);
const leftSeconds = computed(() => 60 - timeSlice.value);

const clockStatus = ref<ClockStatus>('idle');
const clockType = ref<ClockType>('task');

const handleClockClick = () => {
    if (clockStatus.value === 'idle') {
        clockStatus.value = 'doing';
    } else {
        clockStatus.value = 'idle';
    }
};
</script>
