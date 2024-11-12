import {StarSystemService} from "../star-system.service";
import {StarSystem} from "../star-system";
import * as _ from "lodash";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {MatFormField} from "@angular/material/form-field";
import {MatLabel, MatOption, MatSelect} from "@angular/material/select";
import {SortByPipe} from "../sort-by.pipe";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-pathfinder',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    SortByPipe,
    NgForOf
  ],
  templateUrl: './pathfinder.component.html',
  styleUrl: './pathfinder.component.css'
})
export class PathfinderComponent {
  @Input() originStarSystem!: StarSystem;
  @Input() destStarSystem!: StarSystem;
  @Output() originStarSystemChange = new EventEmitter<StarSystem>();
  @Output() destStarSystemChange = new EventEmitter<StarSystem>();

  paths: string[][] | undefined;

  starSystems = this.starSystemsService.getStarSystems();

  distance = new Map<string, number>();
  previous = new Map<string, string[] | undefined>();
  queue = new Set<string>();

  iterCount = 0;
  current: StarSystem | undefined;

  constructor(private starSystemsService: StarSystemService) {
  }

  updateOriginStarSystem() {
    this.originStarSystemChange.emit(this.originStarSystem);
    this.updatePaths();
  }

  updateDestStarSystem() {
    this.destStarSystemChange.emit(this.destStarSystem);
    this.updatePaths();
  }

  updatePaths() {
    if (this.originStarSystem && this.destStarSystem) {
      this.paths = this.findPath(this.originStarSystem, this.destStarSystem);
    }
  }

  findPath(origin: StarSystem, destination: StarSystem, allowedJumpLevels: string[] = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon"
  ]) {
    this.createInitialQueue(origin);

    while (this.queue.size) {
      this.iterCount += 1;
      const current = this.getClosestSystem(this.distance, this.queue);

      const val = this.getNextSystems(
        current,
        this.distance,
        this.previous,
        this.queue,
        allowedJumpLevels);
      this.distance = val.distance;
      this.previous = val.previous;
      this.queue = val.queue;

      if (current === destination) {
        return this.buildPaths(origin, destination, this.previous, this.queue);
      }

      if (this.iterCount > 500) {
        this.queue.clear();
      }
    }

    return undefined;
  }

  createInitialQueue(origin: StarSystem) {
    this.starSystemsService.getStarSystems()
      .forEach(starSystem => {
        this.distance.set(starSystem.name, origin.name === starSystem.name ? 0 : Infinity);
        this.previous.set(starSystem.name, undefined)
        this.queue.add(starSystem.name);
      });
  }

  getClosestSystem(distance: Map<string, number>, queue: Set<string>) {
    const closestSystem = _.minBy(
      [...distance.entries()].filter(entry => queue.has(entry[0])),
      entry => entry[1]
    );

    return this.starSystemsService.getStarSystems()
      .filter(starSystem => starSystem.name === (closestSystem ? closestSystem[0] : ""))
      .filter((starSystem): starSystem is StarSystem => starSystem !== undefined)[0];
  }

  getNextSystems(
    currentSystem: StarSystem,
    distance: Map<string, number>,
    previous: Map<string, string[] | undefined>,
    queue: Set<string>,
    allowedJumpLevels: string[]) {
    queue.delete(currentSystem.name);

    const jumpLinks = currentSystem.jumpLinks
      .filter(jumpLink => jumpLink.discovered)
      .filter(jumpLink => queue.has(jumpLink.destination))
      .filter(jumpLink => allowedJumpLevels.includes(jumpLink.jumpLevel));

    jumpLinks.forEach(jumpLink => {
      const distanceToCurrent = (distance.get(currentSystem.name) ?? Infinity) + 1;
      const distanceToJumpDestination = this.distance.get(jumpLink.destination) ?? Infinity;

      if (distanceToCurrent < distanceToJumpDestination) {
        distance.set(jumpLink.destination, distanceToCurrent);
        previous.set(jumpLink.destination, [currentSystem.name]);
      } else if (distanceToCurrent === distanceToJumpDestination) {
        const systems = previous.get(jumpLink.destination);
        if (systems) systems.push(currentSystem.name);
        previous.set(jumpLink.destination, systems);
      }
    });

    return {
      distance: distance,
      previous: previous,
      queue: queue
    };
  }

  buildPaths(origin: StarSystem,
             destination: StarSystem,
             previous: Map<string, string[] | undefined>,
             queue: Set<string>): string[][] | undefined {
    queue.clear();
    if (previous.get(destination.name) === undefined) {
      return undefined;
    }
    return this.traversePath(destination.name, previous, []);
  }

  traversePath(currentSystem: string | undefined,
               previous: Map<string, string[] | undefined>,
               existingPath: string[]): string[][] {
    if (currentSystem === undefined) {
      return [existingPath];
    } else {
      const newPath = [currentSystem, ...existingPath];
      const nextSystem = previous.get(currentSystem);
      if (nextSystem) {
        return nextSystem.flatMap(system => this.traversePath(system, previous, newPath));
      } else {
        return this.traversePath(nextSystem, previous, newPath);
      }
    }
  }
}
