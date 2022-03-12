<template>
    <Sector :color="currentColor" :deg="taskDeg">
        <div :class="['wrapper', props.type === 'task' ? 'task' : 'break']">
            <div
                :class="[
                    'seconds',
                    'text-center',
                    'middle',
                    'font-medium',
                    isOptions ? 'text-8xl' : 'text-base',
                ]"
            >
                <span>{{ formatTime(leftTime.minute) }}</span>
                :
                <span>{{ formatTime(leftTime.seconds) }}</span>
            </div>
            <div class="control">
                <ic:round-play-arrow
                    v-show="props.status === 'idle'"
                    class="btn middle"
                    :style="controlStyle"
                />
                <ic:round-stop
                    v-show="props.status === 'doing'"
                    class="btn middle"
                    :style="controlStyle"
                />
            </div>
        </div>
    </Sector>
</template>

<script lang="ts" setup>
import { CSSProperties } from 'vue';
import { TaskStatus, TaskType } from '~/message';

const props = defineProps<{
    // 剩余时间
    leftSeconds: number;
    totalSeconds: number;
    status: TaskStatus;
    type: TaskType;
    isOptions?: boolean;
}>();

const Color = {
    task: 'red',
    break: '#43aa8b',
};

const currentColor = computed(() =>
    props.type === 'task' ? Color.task : Color.break
);

// 当前任务完成度
const taskDeg = computed(() => {
    const targetDeg = Math.floor(
        (1 - props.leftSeconds / props.totalSeconds) * 360
    );

    return targetDeg >= 360 ? 360 : targetDeg;
});

const formatTime = (time: number) => {
    if (time < 0) {
        time = 0;
    }

    return time < 10 ? `0${time}` : `${time}`;
};

const leftTime = computed(() => {
    const minute = Math.floor(props.leftSeconds / 60);
    const seconds = props.leftSeconds % 60;

    return {
        minute,
        seconds,
    };
});

const controlStyle = computed<CSSProperties>(() => ({
    fontSize: props.isOptions ? '6rem' : '3rem',
}));
</script>

<style scoped lang="less">
.middle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.wrapper {
    &.task {
        color: red;
    }

    &.break {
        color: #43aa8b;
    }

    .seconds {
        width: 100%;
    }

    .control {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        background: white;
        border-radius: 50%;
        cursor: pointer;
    }

    .control:hover {
        opacity: 0.8;
    }
}
</style>
