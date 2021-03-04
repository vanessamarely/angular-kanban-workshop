import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ListSchema, TaskSchema } from './../../../core';
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { TaskService } from 'src/app/core/services/task.service';
@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent implements OnInit {
  @Input() task: TaskSchema;
  @Output() editTask: EventEmitter<TaskSchema> = new EventEmitter();
  @Input() list?: ListSchema;

  constructor(public dialog: MatDialog, public tasksService: TaskService) {}

  ngOnInit(): void {}

  handleEditTask(task: TaskSchema) {
    this.editTask.emit(task);
  }

  removeTask(taskId: string): void {
    const dialogRef = this.dialog.open(ModalComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (this.list) {
        this.tasksService.removeTask(taskId, this.list);
      }
    });
  }
}
