import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StarMapComponent} from './star-map.component';
import {StarSystem} from "../star-system";
import {StarSystemService} from "../star-system.service";
import {Scene, Vector2} from "three";

let starSystemService: { getStarSystems: jest.Mock; };
const starSystemServiceReturnValue: StarSystem[] = [
  {
    name: 'Alpha Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 1, y: 2, z: 2},
    jumpLinks: [{destination: 'Omega Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}]
  },
  {
    name: 'Omega Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 2, y: 2, z: 1},
    jumpLinks: [{destination: 'Alpha Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}]
  }
];

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'),
      setAnimationLoop: jest.fn(),
      setSize: jest.fn()
    })
  };
});

describe('StarMapComponent', () => {
  let component: StarMapComponent;
  let fixture: ComponentFixture<StarMapComponent>;

  beforeEach(async () => {
    starSystemService = {
      getStarSystems: jest.fn()
    };
    starSystemService.getStarSystems.mockReturnValue(starSystemServiceReturnValue);

    await TestBed.configureTestingModule({
      imports: [StarMapComponent]
    }).overrideProvider(StarSystemService, {useValue: starSystemService})
      .compileComponents();

    fixture = TestBed.createComponent(StarMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should add the stars to the scene', () => {
    const scene = new Scene();
    jest.spyOn(scene, 'add');
    component.addStars(scene);
    expect(scene.add).toHaveBeenCalledTimes(2);
  });

  it('should add the jump links to the scene', () => {
    const scene = new Scene();
    jest.spyOn(scene, 'add');
    component.addJumpLinks(scene);
    expect(scene.add).toHaveBeenCalledTimes(2);
  });

  it('should update the click location', () => {
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);

    const mouseEvent = new MouseEvent('click', {clientX: 11, clientY: 42})
    component.click(mouseEvent);
    const expected = new Vector2(-0.956, 0.832);
    expect(component.clickLocation).toEqual(expected);

    jest.restoreAllMocks();
  });

  it('should update the mouseDown location', () => {
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);

    const mouseEvent = new MouseEvent('mouseDown', {clientX: 11, clientY: 42})
    component.mouseDown(mouseEvent);
    const expected = new Vector2(-0.956, 0.832);
    expect(component.mouseDownLocation).toEqual(expected);

    jest.restoreAllMocks();
  });

  it('should update the pointerMove location', () => {
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);

    const pointerEvent = new MouseEvent("pointermove", {clientX: 11, clientY: 42});
    component.pointerMove(pointerEvent as PointerEvent);
    const expected = new Vector2(-0.956, 0.832);
    expect(component.hoverLocation).toEqual(expected);

    jest.restoreAllMocks();
  });
});
