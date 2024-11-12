import {PathfinderComponent} from './pathfinder.component';
import {StarSystem} from "../star-system";
import {StarSystemService} from "../star-system.service";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {JumpLinksComponent} from "../jump-links/jump-links.component";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ReactiveFormsModule} from "@angular/forms";

const serviceReturnValue: StarSystem[] = [
  {
    name: "Alpha Hydri", transitTimes: [3, 2, 1], coordinates: {x: 0, y: 0, z: 0}, jumpLinks:
      [
        {destination: "Beta Hydri", jumpLevel: "Gamma", discovered: 1990, distance: 1},
        {destination: "Gamma Hydri", jumpLevel: "Epsilon", discovered: 1990, distance: 1}
      ]
  },
  {
    name: "Beta Hydri", transitTimes: [3, 2, 1], coordinates: {x: 1, y: 0, z: 0}, jumpLinks:
      [
        {destination: "Alpha Hydri", jumpLevel: "Gamma", discovered: 1990, distance: 1},
        {destination: "Gamma Hydri", jumpLevel: "Delta", discovered: 1990, distance: 1}
      ]
  },
  {
    name: "Gamma Hydri", transitTimes: [3, 2, 1], coordinates: {x: 0, y: 1, z: 0}, jumpLinks:
      [
        {destination: "Alpha Hydri", jumpLevel: "Epsilon", discovered: 1990, distance: 1},
        {destination: "Omega Hydri", jumpLevel: "Gamma", discovered: 1990, distance: 1}
      ]
  },
  {
    name: "Omega Hydri", transitTimes: [3, 2, 1], coordinates: {x: 0, y: 0, z: 1}, jumpLinks:
      [
        {destination: "Gamma Hydri", jumpLevel: "Epsilon", discovered: 1990, distance: 1}
      ]
  }
];

describe('PathfinderComponent', () => {
  let fixture: ComponentFixture<PathfinderComponent>;
  let component: PathfinderComponent;

  let starSystemService: {
    getStarSystems: jest.Mock,
    getStarSystem: jest.Mock;
  };
  let mockGetStarSystems = jest.fn();
  let mockGetStarSystem = jest.fn();
  let starSystemServiceReturnValue: StarSystem[] = serviceReturnValue;

  beforeEach(async function () {

    starSystemService = {
      getStarSystems: mockGetStarSystems,
      getStarSystem: mockGetStarSystem
    };
    starSystemService.getStarSystems.mockReturnValue(starSystemServiceReturnValue);

    await TestBed.configureTestingModule({
      imports: [
        JumpLinksComponent,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
        ReactiveFormsModule
      ]
    }).overrideProvider(StarSystemService, {useValue: starSystemService})
      .compileComponents();
    fixture = TestBed.createComponent(PathfinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('initial queue creation', function () {
    it('should populate all systems except origin with a distance of Infinity', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);

      component.createInitialQueue(serviceReturnValue[0]);
      const expected = new Map<string, number>()
        .set("Alpha Hydri", 0)
        .set("Beta Hydri", Infinity)
        .set("Gamma Hydri", Infinity)
        .set("Omega Hydri", Infinity);

      expect(component.distance).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should populate all systems with a previous of undefined', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);

      component.createInitialQueue(serviceReturnValue[0]);
      const expected = new Map<string, string | undefined>()
        .set("Alpha Hydri", undefined)
        .set("Beta Hydri", undefined)
        .set("Gamma Hydri", undefined)
        .set("Omega Hydri", undefined);

      expect(component.previous).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should initially populate the queue with all systems', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);


      component.createInitialQueue(serviceReturnValue[0]);
      const expected = new Set<string>()
        .add("Alpha Hydri")
        .add("Beta Hydri")
        .add("Gamma Hydri")
        .add("Omega Hydri");

      expect(component.queue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });
  });

  describe('get closest system', function () {
    it('should return the closest system', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const distances = new Map<string, number>()
        .set("Alpha Hydri", 0)
        .set("Beta Hydri", Infinity)
        .set("Gamma Hydri", Infinity)
        .set("Omega Hydri", Infinity);
      const queue = new Set<string>;
      serviceReturnValue.forEach(starSystem => queue.add(starSystem.name));

      const returnValue = component.getClosestSystem(distances, queue);
      const expected: StarSystem = serviceReturnValue[0];

      expect(returnValue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });
  });

  describe('get next systems', function () {
    let distance: Map<string, number>;
    let previous: Map<string, string[] | undefined>;
    let queue: Set<string>;

    beforeEach(function () {
      distance = new Map<string, number>()
        .set("Alpha Hydri", 0)
        .set("Beta Hydri", Infinity)
        .set("Gamma Hydri", Infinity)
        .set("Omega Hydri", Infinity);
      previous = new Map<string, string[] | undefined>()
        .set("Alpha Hydri", undefined)
        .set("Beta Hydri", undefined)
        .set("Gamma Hydri", undefined)
        .set("Omega Hydri", undefined);
      queue = new Set<string>;
      serviceReturnValue.forEach(starSystem => queue.add(starSystem.name));
    });

    it('should return an updated distance map', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.getNextSystems(
        serviceReturnValue[0],
        distance,
        previous,
        queue,
        ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]
      );
      const expected = new Map<string, number>()
        .set("Alpha Hydri", 0)
        .set("Beta Hydri", 1)
        .set("Gamma Hydri", 1)
        .set("Omega Hydri", Infinity);

      expect(returnValue.distance).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return an updated distance map, excluding disallowed jump levels', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.getNextSystems(
        serviceReturnValue[0],
        distance,
        previous,
        queue,
        ["Gamma", "Delta"]
      );
      const expected = new Map<string, number>()
        .set("Alpha Hydri", 0)
        .set("Beta Hydri", 1)
        .set("Gamma Hydri", Infinity)
        .set("Omega Hydri", Infinity);

      expect(returnValue.distance).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return an updated previous map', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.getNextSystems(
        serviceReturnValue[0],
        distance,
        previous,
        queue,
        ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]
      );
      const expected = new Map<string, string[] | undefined>()
        .set("Alpha Hydri", undefined)
        .set("Beta Hydri", ["Alpha Hydri"])
        .set("Gamma Hydri", ["Alpha Hydri"])
        .set("Omega Hydri", undefined);

      expect(returnValue.previous).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return an updated previous map, excluding disallowed jump levels', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.getNextSystems(
        serviceReturnValue[0],
        distance,
        previous,
        queue,
        ["Gamma", "Delta"]
      );
      const expected = new Map<string, string[] | undefined>()
        .set("Alpha Hydri", undefined)
        .set("Beta Hydri", ["Alpha Hydri"])
        .set("Gamma Hydri", undefined)
        .set("Omega Hydri", undefined);

      expect(returnValue.previous).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return an updated queue', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.getNextSystems(
        serviceReturnValue[0],
        distance,
        previous,
        queue,
        ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"]
      );
      const expected = new Set<string>()
        .add("Beta Hydri")
        .add("Gamma Hydri")
        .add("Omega Hydri");

      expect(returnValue.queue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });
  });

  describe('build path when destination is found', function () {
    let previous: Map<string, string[] | undefined>;
    let queue: Set<string>;

    beforeEach(function () {
      previous = new Map<string, string[] | undefined>()
        .set("Alpha Hydri", undefined)
        .set("Beta Hydri", ["Alpha Hydri"])
        .set("Gamma Hydri", ["Alpha Hydri"])
        .set("Omega Hydri", ["Gamma Hydri"]);
      queue = new Set<string>;
      serviceReturnValue.forEach(starSystem => queue.add(starSystem.name));
    });

    it('should clear the queue', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      component.buildPaths(serviceReturnValue[0], serviceReturnValue[3], previous, queue);
      const expected = new Set<string>();

      expect(queue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return a path through the nodes', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.buildPaths(serviceReturnValue[0], serviceReturnValue[3], previous, queue);
      const expected = [[
        "Alpha Hydri",
        "Gamma Hydri",
        "Omega Hydri"
      ]];

      expect(returnValue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });
  });

  describe('find path function', function () {
    it('should return a path from the start node to the end node', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.findPath(serviceReturnValue[0], serviceReturnValue[3]);
      const expected: string[][] = [[
        "Alpha Hydri",
        "Gamma Hydri",
        "Omega Hydri"
      ]];

      expect(returnValue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return a path from the start node to the end node, restricted to the jump levels', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      const returnValue = component.findPath(
        serviceReturnValue[0],
        serviceReturnValue[3],
        ["Gamma", "Delta"]);
      const expected: string[][] = [[
        "Alpha Hydri",
        "Beta Hydri",
        "Gamma Hydri",
        "Omega Hydri"
      ]];

      expect(returnValue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return undefined if no path can be found', function () {
      const serviceReturnValue: StarSystem[] = [
        {
          name: "Start", coordinates: {x: 0, y: 0, z: 0}, transitTimes: [3, 2, 1], jumpLinks: []
        },
        {
          name: "End", coordinates: {x: 1, y: 1, z: 1}, transitTimes: [3, 2, 1], jumpLinks: []
        }
      ];
      mockGetStarSystems.mockReturnValue(serviceReturnValue);

      const returnValue = component.findPath(serviceReturnValue[0], serviceReturnValue[1]);

      expect(returnValue).toBeUndefined();
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return undefined if the iteration failsafe triggers', function () {
      mockGetStarSystems.mockReturnValue(serviceReturnValue);
      component.iterCount = 1979;
      const returnValue = component.findPath(serviceReturnValue[0], serviceReturnValue[1]);
      expect(returnValue).toBeUndefined();
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return undefined if no nodes are provided', function () {
      mockGetStarSystems.mockReturnValue([]);
      const returnValue = component.findPath(serviceReturnValue[0], serviceReturnValue[1]);
      expect(returnValue).toBeUndefined();
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });

    it('should return multiple paths if they are equal', function () {
      const serviceReturnValue: StarSystem[] = [
        {
          name: "Start", coordinates: {x: 0, y: 0, z: 0}, transitTimes: [3, 2, 1], jumpLinks: [
            {destination: "Middle A", distance: 1, jumpLevel: "Gamma", discovered: 1990},
            {destination: "Middle B", distance: 1, jumpLevel: "Gamma", discovered: 1990}
          ]
        },
        {
          name: "Middle A", coordinates: {x: 1, y: 0, z:0}, transitTimes: [3, 2, 1], jumpLinks: [
            {destination: "Start", distance: 1, jumpLevel: "Gamma", discovered: 1990},
            {destination: "End", distance: 1, jumpLevel: "Gamma", discovered: 1990}
          ]
        },
        {
          name: "Middle B", coordinates: {x: 0, y: 1, z:0}, transitTimes: [3, 2, 1], jumpLinks: [
            {destination: "Start", distance: 1, jumpLevel: "Gamma", discovered: 1990},
            {destination: "End", distance: 1, jumpLevel: "Gamma", discovered: 1990}
          ]
        },
        {
          name: "End", coordinates: {x: 1, y: 1, z: 1}, transitTimes: [3, 2, 1], jumpLinks: [
            {destination: "Middle A", distance: 1, jumpLevel: "Gamma", discovered: 1990},
            {destination: "Middle B", distance: 1, jumpLevel: "Gamma", discovered: 1990}
          ]
        }
      ];
      mockGetStarSystems.mockReturnValue(serviceReturnValue);

      const returnValue = component.findPath(serviceReturnValue[0], serviceReturnValue[3]);
      const expected: string[][] = [
        ["Start", "Middle A", "End"],
        ["Start", "Middle B", "End"]
      ];

      expect(returnValue).toEqual(expected);
      expect(mockGetStarSystems).toHaveBeenCalled();
      expect(mockGetStarSystem).not.toHaveBeenCalled();
    });
  });
});
