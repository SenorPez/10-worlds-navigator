import {JumpLink} from "./jump-link";

export interface StarSystem {
  name: string;
  transitTimes: number[];
  jumpLinks: JumpLink[];
  coordinates: {
    x: number,
    y: number,
    z: number
  }
}
