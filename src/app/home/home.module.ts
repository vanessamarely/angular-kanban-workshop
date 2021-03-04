import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialCdkModule } from './../material-cdk/material-cdk.module';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home/home.component';


@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    MaterialCdkModule,
  ]
})
export class HomeModule { }
