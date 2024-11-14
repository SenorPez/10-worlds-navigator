import {Component} from '@angular/core';
import {StarSystem} from "./star-system";
import {StarSystemService} from "./star-system.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '10 Worlds Navigator';
  starSystem: StarSystem;
  destStarSystem!: StarSystem;

  constructor(private starSystemService: StarSystemService) {
    this.starSystem = starSystemService.getStarSystems()[0];
  }
}
