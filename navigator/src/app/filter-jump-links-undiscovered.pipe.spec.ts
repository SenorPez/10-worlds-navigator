import { FilterJumpLinksUndiscoveredPipe } from './filter-jump-links-undiscovered.pipe';
import {JumpLink} from "./jump-link";

describe('FilterJumpLinksUndiscoveredPipe', () => {
  let pipe: FilterJumpLinksUndiscoveredPipe;
  const testData: JumpLink[] = [
    {
      destination: "Beta Hydri",
      distance: 2,
      jumpLevel: "Beta",
      discovered: 1990
    },
    {
      destination: "Omega Hydri",
      distance: 2,
      jumpLevel: "Epsilon",
      discovered: null
    }
  ];

  beforeEach(function () {
    pipe = new FilterJumpLinksUndiscoveredPipe();
  });

  it('should create an instance', function () {
    expect(pipe).toBeTruthy();
  });

  it('should filter undiscovered links', function () {
    expect(pipe.transform(testData)).toEqual([testData[0]]);
  });

  it('should return an empty array if the input array is empty', function () {
    expect(pipe.transform([])).toEqual([]);
  });
});
