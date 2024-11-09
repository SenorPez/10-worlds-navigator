import {StarSystemService} from "./star-system.service";
import {StarSystem} from "./star-system";
import * as _ from "lodash";

export class Pathfinder {
  constructor(private starSystemsService: StarSystemService) {
  }

  findPath(origin: StarSystem, destination: StarSystem) {
    const distance = new Map<string, number>();
    const previous = new Map<string, string | undefined>();
    const queue = new Set<string>();

    this.starSystemsService.getStarSystems()
      .forEach(starSystem => {
        distance.set(starSystem.name, origin.name === starSystem.name ? 0 : Infinity);
        previous.set(starSystem.name, undefined)
        queue.add(starSystem.name);
      });

    let iterCount = 0;
    while (queue.size) {
      iterCount += 1;
      const distancesInQueue = ([...distance.entries()])
        .filter(entry => queue.has(entry[0]));
      const minimumDistance = _.minBy(distancesInQueue, entry => entry[1]);
      const current = this.starSystemsService.getStarSystems()
        .filter(starSystem => starSystem.name === (minimumDistance ? minimumDistance[0] : ""))
        .filter((starSystem): starSystem is StarSystem => starSystem !== undefined)[0];

      if (current != destination) {
        queue.delete(current.name);

        const jumpLinks = current.jumpLinks;
        const discoveredJumplinks = jumpLinks.filter(jumpLink => jumpLink.discovered);
        const queuedJumpLinks = discoveredJumplinks.filter(jumpLink => queue.has(jumpLink.destination));

        queuedJumpLinks.forEach(jumpLink => {
          const distanceToCurrent = (distance.get(current.name) ?? Infinity) + 1;
          const distanceToJumpDestination = distance.get(jumpLink.destination) ?? Infinity;

          if (distanceToCurrent < distanceToJumpDestination) {
            distance.set(jumpLink.destination, distanceToCurrent);
            previous.set(jumpLink.destination, current.name);
          }
        });
      } else {
        queue.clear();
        const path = new Array<string>();
        let nextStep: string | undefined = current.name;
        if (previous.has(nextStep) || nextStep === origin.name) {
          while (nextStep !== undefined) {
            path.unshift(nextStep);
            nextStep = previous.get(nextStep);
          }
        }
        return path;
      }

      if (iterCount > 500) {
        queue.clear();
      }
    }

    return undefined;
  }
}
