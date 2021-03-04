import { Component, OnInit } from '@angular/core';
import { ApiService, ListSchema, TaskSchema } from './../../core';
import { TaskService } from 'src/app/core/services/task.service';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';

const initialValue = {
  id: '',
  description: '',
  date: '',
  priority: '',
};
@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit {
  lists: ListSchema[];
  task: TaskSchema;
  isOverlayDisplayed = false;
  readonly overlayOptions: Partial<CdkConnectedOverlay> = {
    hasBackdrop: true,
    positions: [
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top' },
    ],
  };
  listId: string;

  constructor(private apiService: ApiService, private taskService: TaskService) {
    this.task = initialValue;
    this.lists = [];
  }

  ngOnInit(): void {
    // this.getDataList();
    this.getDataStored();
  }

  getDataList(): void {
    this.apiService.getApi().subscribe(
      (response: any) => (this.lists = response['list']),
      (error: string) => console.log('Ups! we have an error: ', error)
    );
  }

  getDataStored(): void {
    this.taskService.getBoardList$
      .subscribe(
        (response: any) => this.lists = response,
        (error: string) => (console.log('Ups! we have an error: ', error))
    );
  }

  displayOverlay(event?: TaskSchema): void {
    this.isOverlayDisplayed = true;
    if (!!event) {
      this.task = {
        date: event.date,
        id: event.id,
        description: event.description,
        priority: event.priority,
      };
      if(event.listId){
        this.listId = event.listId;
      }
      
    } else {
      this.task = initialValue;
    }
  }

  hideOverlay(): void {
    this.isOverlayDisplayed = false;
  }
}
