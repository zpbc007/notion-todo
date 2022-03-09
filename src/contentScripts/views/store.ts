import { useIntervalFn } from '@vueuse/core';
import { onMessage, sendMessage } from 'webext-bridge';
import {
    BackgroundReceiveEvent,
    ContentReceiveEvent,
    TaskInfo,
} from '~/message';

export function useTaskStore() {
    const curTask = ref<TaskInfo>();
    const leftSeconds = ref(0);

    const totalSeconds = computed(() => {
        if (!curTask.value) {
            return 0;
        }

        return curTask.value.planDuration;
    });

    useIntervalFn(() => {
        if (!curTask.value || curTask.value.status !== 'doing') {
            return (leftSeconds.value = totalSeconds.value);
        }

        const { planDuration, startTimestamp } = curTask.value;

        leftSeconds.value = Math.max(
            0,
            Math.floor(planDuration - (Date.now() - startTimestamp) / 1000)
        );
    }, 1000);

    onMounted(async () => {
        const task: TaskInfo = await sendMessage(
            BackgroundReceiveEvent.getLatestTaskInfo,
            null,
            'background'
        );

        console.warn('initial task: ', task);
        curTask.value = task;
    });

    onMessage(ContentReceiveEvent.taskInfoUpdated, ({ data }) => {
        console.warn('update task: ', data);
        curTask.value = data as TaskInfo;
    });

    return {
        curTask,
        startTask: () => {
            if (!curTask.value) {
                return;
            }
            sendMessage(BackgroundReceiveEvent.startTask, {
                id: curTask.value.id,
            });
        },
        stopTask: () => {
            if (!curTask.value) {
                return;
            }

            sendMessage(BackgroundReceiveEvent.stopTask, {
                id: curTask.value.id,
            });
        },
        leftSeconds,
        totalSeconds,
    };
}
