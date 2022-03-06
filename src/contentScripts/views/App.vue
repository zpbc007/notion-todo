<template>
    <div
        class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em flex-col"
    >
        <Sector class="w-20 h-20" color="red" :deg="deg">
            <div class="text-base font-medium">
                <span>{{ formatTime(leftTime.minute) }}</span>
                :
                <span>{{ formatTime(leftTime.seconds) }}</span>
            </div>
        </Sector>
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

const [show, toggle] = useToggle(false);
const timeSlice = useInterval(1000);
// 一分钟
const totalTime = 60;

const deg = computed(() => {
    const targetDeg = Math.floor((timeSlice.value / totalTime) * 360);

    return targetDeg >= 360 ? 360 : targetDeg;
});

const leftTime = computed(() => {
    const leftSeconds = totalTime - timeSlice.value;
    const minute = Math.floor(leftSeconds / 60);
    const seconds = leftSeconds % 60;

    return {
        minute,
        seconds,
    };
});

const formatTime = (time: number) => {
    if (time < 0) {
        time = 0;
    }

    return time < 10 ? `0${time}` : `${time}`;
};
</script>
