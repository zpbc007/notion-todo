import { v4 } from 'uuid';
import { TaskInfo, TaskStatus, TaskType } from '~/message';

const Seconds = {
    // task: 25 * 60,
    // break: 5 * 60,
    // longBreak: 15 * 60,
    task: 20,
    break: 15,
    longBreak: 30,
};

export class Task implements TaskInfo {
    static fronJSON(info: TaskInfo) {
        const task = new Task(info.type, info.id);
        task.startTimestamp = info.startTimestamp;
        task.endTimestamp = info.endTimestamp;
        task.planDuration = info.planDuration;
        task.status = info.status;

        return task;
    }

    // 任务开始时间
    startTimestamp = 0;
    // 任务结束时间（任务可能提前结束）
    endTimestamp = 0;
    // 计划时长（秒）
    planDuration = 0;
    // 当前状态
    private _status: TaskStatus = 'idle';

    constructor(readonly type: TaskType, public id = v4()) {
        this.planDuration = Seconds[type];
    }

    start() {
        // 已经结束了
        if (!this.canStart) {
            return false;
        }

        this._status = 'doing';
        this.startTimestamp = Date.now();

        return true;
    }

    stop() {
        if (this.isFinished) {
            return false;
        }

        this.status = 'interrupt';
        this.endTimestamp = Date.now();

        return true;
    }

    get status() {
        return this._status;
    }

    private set status(value: TaskStatus) {
        this._status = value;
    }

    get canStart() {
        return !this.isFinished && this.status !== 'doing';
    }

    get isBreak() {
        return this.type === 'break' || this.type === 'longBreak';
    }

    get isDoing() {
        return this.status === 'doing';
    }

    get isInterrupted() {
        return this.status === 'interrupt';
    }

    get isDone() {
        return this.status === 'done';
    }

    get isFinished() {
        if (this.status === 'idle') {
            return false;
        }

        if (this.status !== 'doing') {
            return true;
        }

        const finished =
            Date.now() - this.startTimestamp - this.planDuration * 1000 > 0;

        if (finished) {
            this.done();
        }
        return finished;
    }

    toJSON(): TaskInfo {
        const { id, startTimestamp, endTimestamp, type, status, planDuration } =
            this;

        return {
            id,
            type,
            status,
            startTimestamp,
            endTimestamp,
            planDuration,
        };
    }

    private done() {
        this.endTimestamp = Date.now();
        this.status = 'done';
    }
}
