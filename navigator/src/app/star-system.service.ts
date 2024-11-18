import { Injectable } from '@angular/core';

import data from './star-systems.json'
import {StarSystem} from "./star-system";

@Injectable({
  providedIn: 'root'
})
export class StarSystemService {
  constructor() {
  }

  getStarSystems(): StarSystem[] {
    return data as StarSystem[];
  }

  getStarSystem(starSystemName: string): StarSystem | undefined {
    return this.getStarSystems()
      .find(starSystem => starSystem.name === starSystemName);
  }
}
