export type ClockType =
    | 'task' // 任务
    | 'break' // 休息
    | 'longBreak'; // 休息

export type ClockStatus =
    | 'idle' // 未开始状态
    | 'doing'; // 任务进行中
