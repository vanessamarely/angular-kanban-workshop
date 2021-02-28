import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskSchema } from "./../../../core";

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() task: TaskSchema;
  @Output() editTask: EventEmitter<TaskSchema> = new EventEmitter();


  constructor() { }

  ngOnInit(): void {
  }

  handleEditTask(task: TaskSchema){
    this.editTask.emit(task);
  }

}
