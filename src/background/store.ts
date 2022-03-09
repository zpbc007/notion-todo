import { Task } from './task';
import { TaskInfo, TaskType } from '~/message';

// 存储最新的 task id
const LatestTaskIdKey = 'LatestTaskIdKey';
// 存储任务次数
const TaskTimeKey = 'TaskTimeKey';

class TaskStore {
    async getLatestTask() {
        const latestTaskId = await this.getDataByKey<string>(LatestTaskIdKey);

        if (!latestTaskId) {
            return null;
        }

        const taskInfo = await this.getDataByKey<TaskInfo>(latestTaskId);

        return Task.fronJSON(taskInfo!);
    }

    async createLatestTask(type: TaskType = 'task') {
        const task = new Task(type);

        await this.saveTask(task, true);
        return task;
    }

    async saveTask(task: Task, latest = false) {
        const taskInfo = task.toJSON();

        const data: Record<string, any> = {
            [taskInfo.id]: taskInfo,
        };

        if (latest) {
            data[LatestTaskIdKey] = task.id;
        }

        await this.saveData(data);
    }

    async startTask(task: Task) {
        if (!task.canStart) {
            return false;
        }

        task.start();

        await this.saveTask(task);

        return true;
    }

    async stopTask(task: Task) {
        task.stop();
        await this.saveTask(task);
        await this.getNextTask(task);
    }

    async getNextTask(task: Task): Promise<TaskInfo> {
        // 未完成，依然处理当前任务
        if (!task.isDone) {
            return this.createLatestTask(task.type);
        }

        let taskTime = await this.getTaskTime();

        if (task.type === 'break') {
            taskTime++;
            await this.saveTaskTime(taskTime);
        }

        // break => task
        if (task.isBreak) {
            return this.createLatestTask('task');
        }

        if (taskTime < 3) {
            // task => break
            return this.createLatestTask('break');
        } else {
            // 重置
            await this.saveTaskTime(0);
            return this.createLatestTask('longBreak');
        }
    }

    private getDataByKey<T>(key: string): Promise<T | null> {
        return browser.storage.sync.get(key).then((data) => data[key] || null);
    }

    private saveData(data: Record<string, any>) {
        return browser.storage.sync.set(data);
    }

    private async getTaskTime() {
        const time = await this.getDataByKey<number>(TaskTimeKey);

        return time || 0;
    }

    private saveTaskTime(time: number) {
        return this.saveData({
            [TaskTimeKey]: time,
        });
    }
}

export const taskStore = new TaskStore();
