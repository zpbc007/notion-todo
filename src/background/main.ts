import { sendMessage, onMessage } from 'webext-bridge';
import { taskStore } from './store';
import {
    TaskInfo,
    BackgroundReceiveEvent,
    MessageResult,
    ContentReceiveEvent,
    StartTaskResult,
} from '~/message';

// only on dev mode
if (import.meta.hot) {
    // @ts-expect-error for background HMR
    import('/@vite/client');
    // load latest content script
    import('./contentScriptHMR');
}

const StartTaskResultMsg = {
    [StartTaskResult.CanNotFind]: (id: string) =>
        `找不到 id: ${id} 对应的 task`,
    [StartTaskResult.CanNotStart]: (id: string) => `任务 id: ${id} 无法开始`,
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

const TodoAlarmKey = 'TodoAlarmKey';

/**
 * task 到达终态
 * TODO: 后续可以发送到 server 上
 */
function taskFinished(taskInfo: TaskInfo) {
    console.warn(`task finished: `, taskInfo);
}

// 获取当前最新任务状态
onMessage(
    BackgroundReceiveEvent.getLatestTaskInfo,
    async (): Promise<TaskInfo> => {
        let latestTask = await taskStore.getLatestTask();

        if (!latestTask) {
            latestTask = await taskStore.createLatestTask();
        }

        // 任务还未完成
        if (!latestTask.isFinished) {
            return latestTask;
        }

        // 已经结束了
        taskFinished(latestTask);
        await taskStore.saveTask(latestTask);

        // 获取下次任务
        return taskStore.getNextTask(latestTask);
    }
);

// 开始任务
onMessage(
    BackgroundReceiveEvent.startTask,
    async ({ data }): Promise<MessageResult<string>> => {
        const { id } = data as { id: string };
        const latestTask = await taskStore.getLatestTask();

        if (!latestTask || latestTask.id !== id) {
            return createStartTaskResult(StartTaskResult.CanNotFind, id);
        }

        if (!latestTask.canStart) {
            return createStartTaskResult(StartTaskResult.CanNotStart, id);
        }

        // 注册定时器
        browser.alarms.create(TodoAlarmKey, {
            when: Date.now() + latestTask.planDuration * 1000,
        });
        await taskStore.startTask(latestTask);

        return createStartTaskResult(StartTaskResult.Success, id);
    }
);

// 结束任务
onMessage(
    BackgroundReceiveEvent.stopTask,
    async ({ data }): Promise<MessageResult<string>> => {
        const { id } = data as { id: string };
        const latestTask = await taskStore.getLatestTask();

        if (!latestTask || latestTask.id !== id) {
            return {
                result: 0,
                data: id,
                msg: `找不到 id: ${id} 对应的 task`,
            };
        }

        await taskStore.stopTask(latestTask);

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
    if (name !== TodoAlarmKey) {
        return;
    }

    const latestTask = await taskStore.getLatestTask();

    if (!latestTask) {
        return taskStore.createLatestTask();
    }

    if (!latestTask.isFinished) {
        return;
    }

    await taskStore.saveTask(latestTask);
    await taskStore.getNextTask(latestTask);
});

// 通知 content 发生变化
browser.storage.onChanged.addListener(async () => {
    const task = await taskStore.getLatestTask();
    if (!task) {
        return;
    }
    const tabs = await browser.tabs.query({});

    tabs.forEach((item) =>
        sendMessage(
            ContentReceiveEvent.taskInfoUpdated,
            task.toJSON() as any,
            `content-script@${item.id}`
        )
    );
});
