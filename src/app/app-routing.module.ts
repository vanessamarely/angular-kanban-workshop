import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'board',
    //before syntax deprecated in v.8
    //loadChildren: './board/board.module#BoardModule'
    loadChildren: () => import('./board/board.module').then(m => m.BoardModule)
  },
  {
    path: 'home',
    //before syntax deprecated in v.8
    //loadChildren: './home/home.module#HomeModule',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // preload all modules; optionally we could
    // implement a custom preloading strategy for just some
    // of the modules
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
