import { Injectable } from '@angular/core';

import data from './star-systems.json'
import {StarSystem} from "./star-system";

@Injectable({
  providedIn: 'root'
})
export class StarSystemService {
  starSystems: StarSystem[];

  constructor() {
    this.starSystems = data as StarSystem[];
  }

  getStarSystems(): StarSystem[] {
    return this.starSystems;
  }

  getStarSystem(starSystemName: string): StarSystem | undefined {
    return this.getStarSystems()
      .find(starSystem => starSystem.name === starSystemName);
  }
}
