export type TaskType =
    | 'task' // 任务
    | 'break' // 休息
    | 'longBreak'; // 长休息

export type TaskStatus =
    | 'idle' // 未开始状态
    | 'doing' // 任务进行中
    | 'done' // 正常结束
    | 'interrupt'; // 被打断

export type TaskInfo = {
    id: string;
    type: TaskType;
    status: TaskStatus;
    // 任务开始时间
    startTimestamp: number;
    // 任务结束时间（任务可能提前结束）
    endTimestamp: number;
    // 计划时长（秒）
    planDuration: number;
};

export const ContentReceiveEvent = {
    taskInfoUpdated: 'taskInfoUpdated',
};

export const BackgroundReceiveEvent = {
    getLatestTaskInfo: 'getLatestTaskInfo',
    startTask: 'startTask',
    stopTask: 'stopTask',
};

export interface MessageResult<T> {
    result: number;
    data: T;
    msg: string;
}

export enum StartTaskResult {
    CanNotFind = 0,
    Success = 1,
    AlreadyStarted = 2,
    Interrupted = 3,
}
