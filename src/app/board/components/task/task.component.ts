import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskSchema } from "./../../../core";
import { MatDialog } from '@angular/material/dialog';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() task: TaskSchema;
  @Output() editTask: EventEmitter<TaskSchema> = new EventEmitter();


  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  handleEditTask(task: TaskSchema){
    this.editTask.emit(task);
  }

  removeTask(taskId: string): void {
    console.log('Eliminar tarea', taskId);
    const dialogRef = this.dialog.open(ModalComponent);
    dialogRef.afterClosed().subscribe(result => {
      console.log('Eliminar tarea', result);
    });
  }

}
