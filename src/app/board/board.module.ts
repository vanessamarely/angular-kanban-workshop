import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';



import { BoardRoutingModule } from './board-routing.module';
import { BoardComponent } from './board/board.component';


@NgModule({
  declarations: [BoardComponent],
  imports: [
    CommonModule,
    BoardRoutingModule, 

  ]
})
export class BoardModule { }
