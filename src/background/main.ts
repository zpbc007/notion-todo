import { sendMessage, onMessage } from 'webext-bridge';
import { v4 } from 'uuid';
import {
    TaskInfo,
    BackgroundReceiveEvent,
    MessageResult,
    ContentReceiveEvent,
    TaskType,
    StartTaskResult,
} from '~/message';

// only on dev mode
if (import.meta.hot) {
    // @ts-expect-error for background HMR
    import('/@vite/client');
    // load latest content script
    import('./contentScriptHMR');
}

const emptyTask: TaskInfo = {
    id: '',
    type: 'task',
    status: 'idle',
    startTimestamp: 0,
    endTimestamp: 0,
    planDuration: 0,
};

const Seconds = {
    // task: 25 * 60,
    // break: 5 * 60,
    // longBreak: 15 * 60,
    task: 20,
    break: 15,
    longBreak: 30,
};

const StartTaskResultMsg = {
    [StartTaskResult.CanNotFind]: (id: string) =>
        `找不到 id: ${id} 对应的 task`,
    [StartTaskResult.AlreadyStarted]: (id: string) =>
        `任务 id: ${id} 已经开始了`,
    [StartTaskResult.Interrupted]: (id: string) => `任务 id: ${id} 已经结束了`,
    [StartTaskResult.Success]: (id: string) => `任务 id: ${id} 创建成功`,
};

function createStartTaskResult(
    result: StartTaskResult,
    id: string
): MessageResult<string> {
    return {
        result,
        data: id,
        msg: StartTaskResultMsg[result](id),
    };
}

const ClockTimeKey = 'ClockTime';
const LatestTaskKey = 'LatestTask';
const AlarmKey = 'TodoAlarm';

/** 获取缓存的 task */
function getLatestTaskInfo(): Promise<null | TaskInfo> {
    return browser.storage.sync
        .get(LatestTaskKey)
        .then((res) => res.LatestTask);
}

function getClockTime(): Promise<number> {
    return browser.storage.sync
        .get(ClockTimeKey)
        .then((res) => res[ClockTimeKey] || 0);
}

/** 更新缓存 task */
function updateLatestTaskInfo(taskInfo: TaskInfo) {
    return browser.storage.sync.set({
        [LatestTaskKey]: taskInfo,
    });
}

function updateClockTime(time: number) {
    return browser.storage.sync.set({
        [ClockTimeKey]: time,
    });
}

/**
 * task 到达终态
 * TODO: 后续可以发送到 server 上
 */
function taskFinished(taskInfo: TaskInfo) {
    console.warn(`task finished: `, taskInfo);
}

/** 创建任务 */
function createTask(type: TaskType): TaskInfo {
    return {
        ...emptyTask,
        type,
        id: v4(),
        status: 'idle',
        planDuration: Seconds[type],
    };
}

/**
 * 根据已完成任务状态，获取下个任务
 * @param taskInfo 当前结束的 task
 * @param clockTime 已经完成了几次
 */
async function getNextTask(taskInfo: TaskInfo): Promise<TaskInfo> {
    // 未完成，依然处理当前任务
    if (taskInfo.status !== 'done') {
        return createTask(taskInfo.type);
    }

    let clockTime = await getClockTime();

    if (taskInfo.type === 'break') {
        clockTime++;
    }

    // 更新 clock time
    await updateClockTime(clockTime);

    // break => task
    if (taskInfo.type === 'break' || taskInfo.type === 'longBreak') {
        return createTask('task');
    }

    if (clockTime < 3) {
        // task => break
        return createTask('break');
    } else {
        // task => longBreak
        return createTask('longBreak');
    }
}

async function getAndSaveNextTask(doneTask: TaskInfo) {
    const nextTask = await getNextTask(doneTask);
    await updateLatestTaskInfo(nextTask);

    return nextTask;
}

/**
 * 任务是否可用
 */
function checkTaskFinished(task: TaskInfo) {
    if (task.status === 'idle') {
        return false;
    }

    return (
        Date.now() - // 任务还未到时间
            task.startTimestamp -
            task.planDuration * 1000 >
        0
    );
}

// 获取当前最新任务状态
onMessage(
    BackgroundReceiveEvent.getLatestTaskInfo,
    async (): Promise<TaskInfo> => {
        let latestTask = await getLatestTaskInfo();

        if (!latestTask) {
            latestTask = createTask('task');

            await updateLatestTaskInfo(latestTask);
        }

        // 任务已经结束
        if (latestTask.status === 'doing' && checkTaskFinished(latestTask)) {
            latestTask.status = 'done';
            latestTask.endTimestamp = Date.now();
        }

        // 只返回可以开始的任务
        if (latestTask.status === 'idle' || latestTask.status === 'doing') {
            return latestTask;
        }

        // 已经结束了
        taskFinished(latestTask);

        // 获取下次任务
        const nextTask = await getNextTask(latestTask);
        updateLatestTaskInfo(nextTask);

        return nextTask;
    }
);

// 开始任务
onMessage(
    BackgroundReceiveEvent.startTask,
    async ({ data }): Promise<MessageResult<string>> => {
        const { id } = data as { id: string };
        const latestTask = await getLatestTaskInfo();

        if (!latestTask || latestTask.id !== id) {
            return createStartTaskResult(StartTaskResult.CanNotFind, id);
        }

        if (latestTask.status === 'doing') {
            return createStartTaskResult(StartTaskResult.AlreadyStarted, id);
        }

        if (latestTask.status === 'interrupt') {
            return createStartTaskResult(StartTaskResult.Interrupted, id);
        }

        const taskInfo: TaskInfo = {
            ...latestTask,
            status: 'doing',
            startTimestamp: Date.now(),
        };
        // 注册定时器
        browser.alarms.create(AlarmKey, {
            when: Date.now() + Seconds[latestTask.type] * 1000,
        });
        await updateLatestTaskInfo(taskInfo);

        return createStartTaskResult(StartTaskResult.Success, id);
    }
);

// 结束任务
onMessage(
    BackgroundReceiveEvent.stopTask,
    async ({ data }): Promise<MessageResult<string>> => {
        const { id } = data as { id: string };
        const latestTask = await getLatestTaskInfo();

        if (!latestTask || latestTask.id !== id) {
            return {
                result: 0,
                data: id,
                msg: `找不到 id: ${id} 对应的 task`,
            };
        }

        const taskInfo: TaskInfo = {
            ...latestTask,
            status: 'interrupt',
            endTimestamp: Date.now(),
        };

        taskFinished(taskInfo);

        await getAndSaveNextTask(taskInfo);

        return {
            result: 1,
            data: id,
            msg: '成功',
        };
    }
);

/**
 * alarm 定时并不准
 */
browser.alarms.onAlarm.addListener(async ({ name }) => {
    if (name !== AlarmKey) {
        return;
    }

    const latestTask = await getLatestTaskInfo();

    if (
        !latestTask || // 任务不存在
        latestTask.status !== 'doing' || // 任务状态不对
        !checkTaskFinished(latestTask) // 任务还未到时间
    ) {
        return;
    }

    const taskInfo: TaskInfo = {
        ...latestTask,
        status: 'done',
        endTimestamp: Date.now(),
    };
    taskFinished(taskInfo);
    getAndSaveNextTask(taskInfo);
});

// 通知 content 发生变化
browser.storage.onChanged.addListener(async (changes) => {
    if (!changes[LatestTaskKey]) {
        return;
    }

    const tabs = await browser.tabs.query({});

    tabs.forEach((item) =>
        sendMessage(
            ContentReceiveEvent.taskInfoUpdated,
            changes[LatestTaskKey].newValue,
            `content-script@${item.id}`
        )
    );
});
