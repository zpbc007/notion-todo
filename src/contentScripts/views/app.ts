import { ClockStatus, ClockType } from '~/components/clock';

const Seconds = {
    task: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60,
    // task: 10,
    // break: 3,
    // longBreak: 5,
};

export function useClockStatus() {
    // 完成几次番茄钟
    const clockTime = ref(0);
    // 当前 clock 走了多久
    const timeSlice = ref(0);
    const totalSeconds = ref(Seconds.task);
    const clockStatus = ref<ClockStatus>('idle');
    const clockType = ref<ClockType>('task');

    return {
        next: () => {
            clockStatus.value = 'idle';
            if (clockType.value === 'break') {
                clockTime.value++;
            }

            // break => task
            if (
                clockType.value === 'break' ||
                clockType.value === 'longBreak'
            ) {
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
        },
        clockStatus,
        clockType,
        clearTimer: () => (timeSlice.value = 0),
        leftSeconds: computed(() => totalSeconds.value - timeSlice.value),
        onTick: () => timeSlice.value++,
        toggle: () => {
            if (clockStatus.value === 'idle') {
                clockStatus.value = 'doing';
            } else {
                clockStatus.value = 'idle';
            }
        },
        totalSeconds,
    };
}
