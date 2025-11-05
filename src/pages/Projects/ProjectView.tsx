import { Box, Grid, Spinner, Heading } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { ColumnType } from '../../utils/enums';
import ProjectColumn from '../../components/ProjectColumn/ProjectColumn';
import useProjectTasks from '../../hooks/useProjectTasks';
import { TaskModel } from '../../utils/models';

export default function ProjectView() {
    const { projectId } = useParams<{ projectId: string }>();
    const {
        loading,
        columns,
        load,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
    } = useProjectTasks(projectId || '');

    if (loading) return <Spinner />;

    const handleCreate = (column: ColumnType) => createTask({ column, title: 'New task' });
    const handleUpdate = (id: string, patch: Partial<TaskModel>) => updateTask(id, patch);
    const handleDelete = (id: string) => deleteTask(id);

    return (
        <Box>
            <Heading mb={4}>Project</Heading>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                {Object.values(ColumnType).map((col) => (
                    <ProjectColumn
                        key={col}
                        column={col as ColumnType}
                        tasks={columns[col as ColumnType] || []}
                        onCreate={handleCreate}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onDropFrom={(from, taskId) => moveTask(from as ColumnType, col as ColumnType, taskId).then(load)}
                    />
                ))}
            </Grid>
        </Box>
    );
}
