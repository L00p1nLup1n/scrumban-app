import { ColumnType } from '../../utils/enums';
import {
    Badge,
    Box,
    Flex,
    Heading,
    IconButton,
    Stack,
    useColorModeValue
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import Task from '../Task/Task';
import useColumnDrop from '../../hooks/useColumnDrop';
import { TaskModel } from '../../utils/models';

function ProjectColumn({
    column,
    tasks,
    onCreate,
    onUpdate,
    onDelete,
    onDropFrom,
}: {
    column: ColumnType;
    tasks: TaskModel[];
    onCreate: (column: ColumnType) => void;
    onUpdate: (id: string, patch: Partial<TaskModel>) => void;
    onDelete: (id: string) => void;
    onDropFrom: (from: ColumnType, taskId: string) => void;
}) {
    const { dropRef, isOver } = useColumnDrop(column, onDropFrom);

    const ColumnTasks = tasks.map((task, index) => (
        <Task
            key={task.id}
            task={task}
            index={index}
            onDropHover={() => { /* no-op for server-backed ordering */ }}
            onUpdate={onUpdate}
            onDelete={onDelete}
        />
    ));

    return (
        <Box>
            <Flex justify="center" align="center" gap={2}>
                <Heading w="full" letterSpacing="wide" textAlign="center">
                    <Badge w="full" px={6} py={3.5} rounded="xl" fontSize="lg">
                        {column}
                    </Badge>
                </Heading>
                <IconButton
                    size="lg"
                    w="30%"
                    color={useColorModeValue('gray.800', 'gray.600')}
                    rounded="xl"
                    variant="solid"
                    fontSize="lg"
                    onClick={() => onCreate(column)}
                    aria-label="add-task"
                    icon={<AddIcon />}
                />
            </Flex>
            <Stack
                ref={dropRef}
                direction={{ base: 'row', md: 'column' }}
                h={{ base: 200, md: 500 }}
                p={3}
                mt={2}
                spacing={4}
                bgColor={useColorModeValue('gray.50', 'gray.900')}
                rounded="lg"
                boxShadow="md"
                overflow="auto"
                opacity={isOver ? 0.85 : 1}
            >
                {ColumnTasks}
            </Stack>
        </Box>
    );
}

export default ProjectColumn;
