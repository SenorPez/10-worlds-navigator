import {StarSystemService} from "./star-system.service";
import {StarSystem} from "./star-system";
import * as _ from "lodash";

export class Pathfinder {
  distance = new Map<string, number>();
  previous = new Map<string, string | undefined>();
  queue = new Set<string>();

  iterCount = 0;
  current: StarSystem | undefined;

  constructor(private starSystemsService: StarSystemService) {
  }

  findPath(origin: StarSystem, destination: StarSystem, allowedJumpLevels: string[] = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon"
  ]) {
    this.createInitialQueue(origin);

    while (this.queue.size) {
      this.iterCount += 1;
      const current = this.getClosestSystem(this.distance, this.queue);

      if (current != destination) {
        const val = this.getNextSystems(
          current,
          this.distance,
          this.previous,
          this.queue,
          allowedJumpLevels);
        this.distance = val.distance;
        this.previous = val.previous;
        this.queue = val.queue;
      } else {
        return this.buildPath(origin, destination, this.previous, this.queue);
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
    previous: Map<string, string | undefined>,
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
        previous.set(jumpLink.destination, currentSystem.name);
      }
    });

    return {
      distance: distance,
      previous: previous,
      queue: queue
    };
  }

  buildPath(origin: StarSystem,
            destination: StarSystem,
            previous: Map<string, string | undefined>,
            queue: Set<string>): string[] | undefined {
    queue.clear();

    const path = new Array<string>();
    let nextStep: string | undefined = destination.name;
    if (previous.has(nextStep) || nextStep === origin.name) {
      while (nextStep !== undefined) {
        path.unshift(nextStep);
        nextStep = previous.get(nextStep);
      }
    }
    return path[0] === origin.name ? path : undefined;
  }
}
