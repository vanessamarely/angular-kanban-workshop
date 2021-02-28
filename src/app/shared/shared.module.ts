import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialCdkModule } from "./../material-cdk/material-cdk.module";

import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ModalComponent } from './components/modal/modal.component';

const declarables = [ HeaderComponent, FooterComponent, ModalComponent ];
@NgModule({
  declarations: [declarables],
  imports: [
    CommonModule,
    RouterModule,
    MaterialCdkModule,
  ],
  exports: declarables,
})
export class SharedModule { }
