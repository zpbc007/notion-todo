import { useIntervalFn } from '@vueuse/core';
import { onMessage, sendMessage } from 'webext-bridge';
import { taskStore } from '~/background/store';
import {
    BackgroundReceiveEvent,
    ContentReceiveEvent,
    TaskInfo,
} from '~/message';

export function useTaskStore(isContent = true) {
    const curTask = ref<TaskInfo>();
    const leftSeconds = ref(0);

    const totalSeconds = computed(() => {
        if (!curTask.value) {
            return 0;
        }

        return curTask.value.planDuration;
    });

    const startTask = () => {
        if (!curTask.value) {
            return;
        }
        sendMessage(BackgroundReceiveEvent.startTask, {
            id: curTask.value.id,
        });
    };
    const stopTask = () => {
        if (!curTask.value) {
            return;
        }

        sendMessage(BackgroundReceiveEvent.stopTask, {
            id: curTask.value.id,
        });
    };

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

    if (isContent) {
        onMessage(ContentReceiveEvent.taskInfoUpdated, ({ data }) => {
            console.warn('update task: ', data);
            curTask.value = data as TaskInfo;
        });
    } else {
        browser.storage.onChanged.addListener(async () => {
            const task = await taskStore.getLatestTask();

            if (!task) {
                return;
            }
            curTask.value = task;
        });
    }

    return {
        curTask,
        toggleTask,
        leftSeconds,
        totalSeconds,
        clockMsg,
    };
}
