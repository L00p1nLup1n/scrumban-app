import { useCallback, useEffect, useState } from 'react';
import { projectsAPI, tasksAPI } from '../api/client';
import { ColumnType } from '../utils/enums';
import { TaskModel } from '../utils/models';
import pickChakraRandomColor from '../helpers/pickChakraRandomColor';

type ColumnsMap = Record<ColumnType, TaskModel[]>;

interface ServerTask {
    _id: string;
    title: string;
    columnKey: string;
    color?: string;
    order?: number;
}

function mapServerTaskToModel(t: ServerTask): TaskModel {
    return {
        id: t._id,
        title: t.title,
        column: t.columnKey as ColumnType,
        color: t.color || pickChakraRandomColor('.200') || '#F7FAFC',
    };
}

export default function useProjectTasks(projectId: string) {
    const [loading, setLoading] = useState(false);
    const [columns, setColumns] = useState<ColumnsMap>({
        'Hot tasks': [],
        'To do': [],
        'In work': [],
        Done: [],
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pRes, tRes] = await Promise.all([
                projectsAPI.get(projectId),
                tasksAPI.list(projectId),
            ]);

            const tasks: ServerTask[] = tRes.data.tasks || [];

            const map: ColumnsMap = {
                [ColumnType.HOT_TASKS]: [],
                [ColumnType.TO_DO]: [],
                [ColumnType.IN_WORK]: [],
                [ColumnType.DONE]: [],
            };

            tasks.forEach((t) => {
                const tm = mapServerTaskToModel(t);
                if (!map[tm.column]) map[tm.column] = [];
                map[tm.column].push(tm);
            });

            // sort by server order if present (we typed ServerTask.order above)
            (Object.keys(map) as Array<keyof ColumnsMap>).forEach((k) => {
                map[k].sort((a, b) => 0); // no-op by default (server order not mapped into TaskModel)
            });

            setColumns(map);
        } catch (err) {
            console.error('load project tasks', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    type CreateTaskPayload = { title: string; columnKey: string; order: number };

    const createTask = useCallback(async (data: { title?: string; column: ColumnType }) => {
        const payload: CreateTaskPayload = {
            title: data.title || 'New task',
            columnKey: data.column,
            order: 1000,
        };

        try {
            await tasksAPI.create(projectId, payload);
            await load();
        } catch (err) {
            console.error('create task', err);
            throw err;
        }
    }, [projectId, load]);

    type UpdateTaskPayload = { title?: string; columnKey?: string; color?: string };

    const updateTask = useCallback(async (taskId: string, patch: Partial<TaskModel>) => {
        try {
            const data: UpdateTaskPayload = {};
            if (patch.title !== undefined) data.title = patch.title;
            if (patch.column !== undefined) data.columnKey = patch.column;
            if (patch.color !== undefined) data.color = patch.color;
            await tasksAPI.update(projectId, taskId, data);
            await load();
        } catch (err) {
            console.error('update task', err);
            throw err;
        }
    }, [projectId, load]);

    const deleteTask = useCallback(async (taskId: string) => {
        try {
            await tasksAPI.delete(projectId, taskId);
            await load();
        } catch (err) {
            console.error('delete task', err);
            throw err;
        }
    }, [projectId, load]);

    const moveTask = useCallback(async (from: ColumnType, to: ColumnType, taskId: string) => {
        try {
            await tasksAPI.update(projectId, taskId, { columnKey: to });
            await load();
        } catch (err) {
            console.error('move task', err);
            throw err;
        }
    }, [projectId, load]);

    const reorder = useCallback(async (tasks: Array<{ id: string; order: number; columnKey?: string }>) => {
        try {
            await tasksAPI.reorder(projectId, tasks);
            await load();
        } catch (err) {
            console.error('reorder tasks', err);
            throw err;
        }
    }, [projectId, load]);

    return {
        columns,
        loading,
        load,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        reorder,
    };
}
