import { Component, OnInit } from '@angular/core';
import { ApiService, ListSchema, TaskSchema } from './../../core';
import { TaskService } from 'src/app/core/services/task.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  taskList: TaskSchema[];

  constructor(private apiService: ApiService, private taskService: TaskService) {}

  ngOnInit(): void {}

  // 
  
  getPrioritiesTask(PriorityType: string): void {
    this.taskService.getBoardList$
      .subscribe(
        (response: ListSchema[]) => {
          const lists = response;
          let tasks: TaskSchema[] = [];
          lists.map((element: ListSchema )=> {
            element.tasks.map((task: TaskSchema) => {
              if(task.priority == PriorityType){
                tasks.push(task)
              }
            });
          });
          this.taskList = tasks;
        },
        (error: string) => (console.log('Ups! we have an error: ', error))
    );
  }
}
