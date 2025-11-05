import Task from '../models/Task.js';
import Project from '../models/Project.js';

export async function listTasks(req, res) {
    try {
        const { projectId } = req.params;

        // Verify project exists and user has access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const tasks = await Task.find({ projectId }).sort({ order: 1 });
        return res.json({ tasks });
    } catch (err) {
        console.error('List tasks error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function createTask(req, res) {
    try {
        const { projectId } = req.params;
        const { title, columnKey, order, description, color, labels, estimate } = req.body;

        if (!title || !columnKey || order === undefined) {
            return res.status(400).json({ error: 'title, columnKey, and order are required' });
        }

        // Verify project exists and user has access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const taskData = {
            projectId,
            title,
            columnKey,
            order,
            description,
            color,
            labels,
            estimate,
            createdBy: req.userId,
        };

        const task = await Task.create(taskData);
        return res.status(201).json({ task });
    } catch (err) {
        console.error('Create task error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateTask(req, res) {
    try {
        const { projectId, taskId } = req.params;
        const updates = req.body;

        // Verify project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const task = await Task.findOne({ _id: taskId, projectId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update allowed fields
        const allowedFields = ['title', 'description', 'color', 'columnKey', 'order', 'assigneeId', 'labels', 'estimate'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                task[field] = updates[field];
            }
        });

        await task.save();
        return res.json({ task });
    } catch (err) {
        console.error('Update task error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteTask(req, res) {
    try {
        const { projectId, taskId } = req.params;

        // Verify project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const task = await Task.findOne({ _id: taskId, projectId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await Task.findByIdAndDelete(taskId);
        return res.status(204).send();
    } catch (err) {
        console.error('Delete task error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function reorderTasks(req, res) {
    try {
        const { projectId } = req.params;
        const { tasks } = req.body; // Array of { id, order, columnKey? }

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'tasks array required' });
        }

        // Verify project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Bulk update tasks
        const bulkOps = tasks.map(({ id, order, columnKey }) => ({
            updateOne: {
                filter: { _id: id, projectId },
                update: { order, ...(columnKey && { columnKey }) },
            },
        }));

        await Task.bulkWrite(bulkOps);
        return res.json({ success: true });
    } catch (err) {
        console.error('Reorder tasks error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Migration endpoint: import tasks from localStorage
export async function importLocalTasks(req, res) {
    try {
        const { projectId } = req.params;
        const { tasks, importId } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'tasks array required' });
        }

        // Verify project access
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (project.ownerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Optional: check if import already done (dedupe by importId)
        // For MVP, we'll just create tasks

        const createdTasks = [];
        for (const [index, taskData] of tasks.entries()) {
            const task = await Task.create({
                projectId,
                title: taskData.title || 'Untitled',
                columnKey: taskData.column || taskData.columnKey || 'to-do',
                color: taskData.color,
                order: (index + 1) * 1000,
                createdBy: req.userId,
            });
            createdTasks.push(task);
        }

        return res.status(201).json({ tasks: createdTasks, imported: createdTasks.length });
    } catch (err) {
        console.error('Import tasks error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
