import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {JumpLinksComponent} from "./jump-links/jump-links.component";
import {StarMapComponent} from "./star-map/star-map.component";

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        JumpLinksComponent,
        StarMapComponent
    ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
