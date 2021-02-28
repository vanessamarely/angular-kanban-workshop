import { TaskSchema } from './index';

export interface ListSchema {
    id: string;
    name: string;
    tasks: TaskSchema[];
}