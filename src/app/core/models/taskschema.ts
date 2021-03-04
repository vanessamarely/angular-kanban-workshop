export interface TaskSchema {
  id: string;
  description: string;
  date: Date | string;
  priority: string;
  listId?: string;
}