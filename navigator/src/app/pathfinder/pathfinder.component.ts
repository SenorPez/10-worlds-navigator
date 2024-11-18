import {StarSystemService} from "../star-system.service";
import {StarSystem} from "../star-system";
import * as _ from "lodash";
import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from "@angular/core";
import {MatFormField} from "@angular/material/form-field";
import {MatLabel, MatOption, MatSelect} from "@angular/material/select";
import {SortByPipe} from "../sort-by.pipe";
import {NgForOf} from "@angular/common";
import {MatButtonToggle, MatButtonToggleChange, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-pathfinder',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    SortByPipe,
    NgForOf,
    MatButtonToggleGroup,
    MatButtonToggle,
    ReactiveFormsModule
  ],
  templateUrl: './pathfinder.component.html',
  styleUrl: './pathfinder.component.css'
})
export class PathfinderComponent implements OnChanges {
  @Input() originStarSystem!: StarSystem;
  @Input() destStarSystem!: StarSystem;

  @Output() originStarSystemChange = new EventEmitter<StarSystem>();
  @Output() destStarSystemChange = new EventEmitter<StarSystem>();
  @Output() jumpLevelsChange = new EventEmitter<string[]>();
  @Output() pathChange = new EventEmitter<string[][]>();

  paths: string[][] | undefined;

  starSystems = this.starSystemsService.getStarSystems();

  jumpLevels = ["Gamma", "Delta", "Epsilon"];

  constructor(private starSystemsService: StarSystemService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.paths = this.updatePaths();
    this.pathChange.emit(this.paths);
    this.jumpLevelsChange.emit(this.jumpLevels);
  }

  updateOriginStarSystem() {
    this.paths = this.updatePaths();
    this.pathChange.emit(this.paths);
    this.originStarSystemChange.emit(this.originStarSystem);
  }

  updateDestStarSystem() {
    this.paths = this.updatePaths();
    this.pathChange.emit(this.paths);
    this.destStarSystemChange.emit(this.destStarSystem);
  }

  updateJumpLevels($event: MatButtonToggleChange) {
    this.updatePaths();
    this.jumpLevels = $event.value;
    this.pathChange.emit(this.paths);
    this.jumpLevelsChange.emit(this.jumpLevels);
  }

  updatePaths() {
    let paths;
    if (this.originStarSystem && this.destStarSystem) {
      paths = this.findPath(this.originStarSystem, this.destStarSystem, this.jumpLevels);
    } else {
      paths = undefined;
    }
    return paths;
  }

  findPath(origin: StarSystem, destination: StarSystem, allowedJumpLevels: string[] = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon"
  ]) {
    let iterCount = 0;
    const val = this.createInitialQueue(origin);

    let distance = val.distance;
    let previous = val.previous;
    let queue = val.queue;

    while (queue.size) {
      iterCount += 1;
      const current = this.getClosestSystem(distance, queue);

      const val = this.getNextSystems(
        current,
        distance,
        previous,
        queue,
        allowedJumpLevels);
      distance = val.distance;
      previous = val.previous;
      queue = val.queue;

      if (current === destination) {
        return this.buildPaths(origin, destination, previous, queue);
      }

      // Just in case.
      if (iterCount > 500) {
        queue.clear();
      }
    }

    return undefined;
  }

  createInitialQueue(origin: StarSystem) {
    const distance = new Map<string, number>();
    const previous = new Map<string, string[] | undefined>();
    const queue = new Set<string>();

    this.starSystemsService.getStarSystems()
      .forEach(starSystem => {
        distance.set(starSystem.name, origin.name === starSystem.name ? 0 : Infinity);
        previous.set(starSystem.name, undefined)
        queue.add(starSystem.name);
      });
    return {
      distance: distance,
      previous: previous,
      queue: queue
    };
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
      const distanceToJumpDestination = distance.get(jumpLink.destination) ?? Infinity;

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
