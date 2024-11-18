import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {JumpLinksComponent} from "./jump-links/jump-links.component";
import {StarMapComponent} from "./star-map/star-map.component";
import {PathfinderComponent} from "./pathfinder/pathfinder.component";

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        JumpLinksComponent,
        StarMapComponent,
        PathfinderComponent
    ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
