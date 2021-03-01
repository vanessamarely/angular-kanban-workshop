import { Component, OnInit } from '@angular/core';
import { ApiService, ListSchema, TaskSchema } from './../../core';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  taskList: TaskSchema[];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {}

  getPrioritiesTask(priorityType: string): void {
    this.apiService.getApi().subscribe(
      (response: any) => {
        const lists = response['list'];
        let tasks: TaskSchema[] = [];
        lists.map((element: ListSchema) => {
          element.tasks.map((task) => {
            if (task.priority === priorityType) {
              tasks.push(task);
            }
          });
        });
        this.taskList = tasks;
      },
      (error) => console.log('Ups! we have an error: ', error)
    );
  }
}
