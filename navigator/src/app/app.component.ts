import { Component } from '@angular/core';
import {StarSystem} from "./star-system";
import {StarSystemService} from "./star-system.service";
import {Pathfinder} from "./pathfinder";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '10 Worlds Navigator';
  starSystem: StarSystem;

  constructor(private starSystemService: StarSystemService) {
    this.starSystem = starSystemService.getStarSystems()[0];

    const pathfinder = new Pathfinder(starSystemService);
    console.log(pathfinder.findPath(
      this.starSystemService.getStarSystems()[0],
      this.starSystemService.getStarSystems()[100]
    ));

  }

  starSystemSelected = (starSystem: StarSystem) => this.starSystem = starSystem;
}
