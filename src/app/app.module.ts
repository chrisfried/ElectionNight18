import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { MatToolbarModule } from '@angular/material/toolbar';
import { NavComponent } from './nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatButtonModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatGridListModule,
  MatCardModule,
  MatMenuModule,
  MatBadgeModule,
  MatExpansionModule
} from '@angular/material';
import { DashComponent } from './dash/dash.component';

import { MnService } from './result-services/mn.service';
import { BrowserStateService } from './browser-state.service';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [AppComponent, NavComponent, DashComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    LayoutModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatBadgeModule,
    MatExpansionModule,
    HttpClientModule
  ],
  providers: [MnService, BrowserStateService],
  bootstrap: [AppComponent]
})
export class AppModule {}
