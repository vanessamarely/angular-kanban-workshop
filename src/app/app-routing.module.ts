import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'board',
    loadChildren: './board/board.module#BoardModule'
    //loadChildren: () => import('./board/board.module').then(m => m.BoardModule)
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomeModule',
    //loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
