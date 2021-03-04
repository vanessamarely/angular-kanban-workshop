import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BoardRoutingModule } from './board-routing.module';
import { MaterialCdkModule } from './../material-cdk/material-cdk.module';

import { BoardComponent } from './board/board.component';
import { ListComponent } from './components/list/list.component';
import { TaskComponent } from './components/task/task.component';
import { CreateTaskComponent } from './components/create-task/create-task.component';

@NgModule({
  declarations: [BoardComponent, ListComponent, TaskComponent, CreateTaskComponent],
  imports: [
    CommonModule,
    BoardRoutingModule, 
    MaterialCdkModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class BoardModule { }
