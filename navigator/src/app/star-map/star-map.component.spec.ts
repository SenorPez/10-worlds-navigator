import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StarMapComponent} from './star-map.component';
import {StarSystem} from "../star-system";
import {StarSystemService} from "../star-system.service";
import {
  Camera,
  Intersection,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3
} from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import {SimpleChanges} from "@angular/core";
import {Line2} from "three/examples/jsm/lines/Line2";
import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";

let starSystemService: { getStarSystems: jest.Mock, getStarSystem: jest.Mock };
const starSystemServiceReturnValue: StarSystem[] = [
  {
    name: 'Sol',
    transitTimes: [3, 2, 1],
    coordinates: {x: 0, y: 0, z: 0},
    jumpLinks: [
      {destination: 'Alpha Hydri', jumpLevel: 'Alpha', discovered: 1990, distance: 1},
      {destination: 'Beta Hydri', jumpLevel: 'Beta', discovered: 1990, distance: 1},
      {destination: 'Gamma Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1},
      {destination: 'Delta Hydri', jumpLevel: 'Delta', discovered: 1990, distance: 1},
      {destination: 'Omega Hydri', jumpLevel: 'Epsilon', discovered: 1990, distance: 1}
    ]
  },
  {
    name: 'Alpha Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 1, y: 1, z: 2},
    jumpLinks: [{destination: 'Sol', jumpLevel: 'Alpha', discovered: 1990, distance: 1}]
  },
  {
    name: 'Beta Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 1, y: 1, z: 1},
    jumpLinks: [{destination: 'Sol', jumpLevel: 'Beta', discovered: 1990, distance: 1}]
  },
  {
    name: 'Gamma Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 1, y: 2, z: 2},
    jumpLinks: [{destination: 'Sol', jumpLevel: 'Gamma', discovered: 1990, distance: 1}]
  },
  {
    name: 'Delta Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 2, y: 1, z: 2},
    jumpLinks: [{destination: 'Sol', jumpLevel: 'Delta', discovered: 1990, distance: 1}]
  },
  {
    name: 'Omega Hydri',
    transitTimes: [3, 2, 1],
    coordinates: {x: 2, y: 2, z: 1},
    jumpLinks: [{destination: 'Sol', jumpLevel: 'Epsilon', discovered: 1990, distance: 1}]
  }
];

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'),
      render: jest.fn(),
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
      getStarSystems: jest.fn(),
      getStarSystem: jest.fn()
    };
    starSystemService.getStarSystems.mockReturnValue(starSystemServiceReturnValue);
    starSystemService.getStarSystem.mockReturnValue(starSystemServiceReturnValue[0]);

    await TestBed.configureTestingModule({
      imports: [StarMapComponent]
    }).overrideProvider(StarSystemService, {useValue: starSystemService})
      .compileComponents();

    fixture = TestBed.createComponent(StarMapComponent);
    component = fixture.componentInstance;
    component.starSystem = {
      name: 'Omega Hydri',
      coordinates: {x: 0, y: 0, z: 0},
      jumpLinks: [],
      transitTimes: [3, 2, 1]
    }
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges lifecycle function', function () {
    it('should unselect the previous origin star system', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      const returnObject= new Object3D();
      getObjectByNameSpy.mockReturnValueOnce(returnObject)
        .mockReturnValue(undefined);
      const unselectStarSystemSpy = jest.spyOn(component, 'unselectStarSystem');
      const changes: Partial<SimpleChanges> = {};

      component.ngOnChanges(changes as SimpleChanges);
      expect(unselectStarSystemSpy).toHaveBeenCalled();
    });

    it('should select the current origin star system', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      const returnObject = new Object3D();
      getObjectByNameSpy.mockReturnValueOnce(undefined)
        .mockReturnValueOnce(returnObject)
        .mockReturnValue(undefined);
      const selectStarSystemSpy = jest.spyOn(component, 'selectStarSystem');
      const changes: Partial<SimpleChanges> = {};

      component.ngOnChanges(changes as SimpleChanges);
      expect(selectStarSystemSpy).toHaveBeenCalled();
    });

    it('should unselect the previous destination star system', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      const returnObject= new Object3D();
      getObjectByNameSpy.mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(returnObject)
        .mockReturnValue(undefined);
      const unselectDestStarSystemSpy = jest.spyOn(component, 'unselectDestStarSystem');
      const changes: Partial<SimpleChanges> = {};

      component.ngOnChanges(changes as SimpleChanges);
      expect(unselectDestStarSystemSpy).toHaveBeenCalled();
    });

    it('should select the current destination star system', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      const returnObject = new Object3D();
      getObjectByNameSpy.mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(returnObject)
        .mockReturnValue(undefined);
      const selectDestStarSystemSpy = jest.spyOn(component, 'selectDestStarSystem');
      const changes: Partial<SimpleChanges> = {};

      component.ngOnChanges(changes as SimpleChanges);
      expect(selectDestStarSystemSpy).toHaveBeenCalled();
    });

    it('should enable the layers included in the jump levels', function () {
      const enableSpy = jest.spyOn(component.camera.layers, 'enable');
      const changes: Partial<SimpleChanges> = {
        jumpLevels: {
          previousValue: undefined,
          currentValue: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
          firstChange: false,
          isFirstChange(): boolean {
            return false;
          }
        }
      };

      component.ngOnChanges(changes as SimpleChanges);
      expect(enableSpy).toBeCalledWith(1);
      expect(enableSpy).toBeCalledWith(2);
      expect(enableSpy).toBeCalledWith(3);
      expect(enableSpy).toBeCalledWith(4);
      expect(enableSpy).toBeCalledWith(5);
    });

    it('should disable the layers included in the jump levels', function () {
      const disableSpy = jest.spyOn(component.camera.layers, 'disable');
      const changes: Partial<SimpleChanges> = {
        jumpLevels: {
          previousValue: undefined,
          currentValue: [],
          firstChange: false,
          isFirstChange(): boolean {
            return false;
          }
        }
      };

      component.ngOnChanges(changes as SimpleChanges);
      expect(disableSpy).toBeCalledWith(1);
      expect(disableSpy).toBeCalledWith(2);
      expect(disableSpy).toBeCalledWith(3);
      expect(disableSpy).toBeCalledWith(4);
      expect(disableSpy).toBeCalledWith(5);
    });

    it('should restore lines if there is a previous value for paths', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      getObjectByNameSpy.mockReturnValue(undefined);
      const changes: Partial<SimpleChanges> = {
        path: {
          previousValue: [["One", "Two"]],
          currentValue: undefined,
          firstChange: false,
          isFirstChange(): boolean {
            return false;
          }
        }
      };
      const originalMaterial: Partial<Material> = {};
      const object: Partial<Line2> = {
        material: undefined,
        userData: {
          originalMaterial: originalMaterial,
          systems: ["One", "Two"]
        },
        type: 'Line2'
      };
      jest.replaceProperty(
        component.scene,
        'children',
        [object as Object3D]);

      component.ngOnChanges(changes as SimpleChanges);
      expect(object.material).toEqual(originalMaterial);
    });

    it('should color lines if there is a current value for paths', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      getObjectByNameSpy.mockReturnValue(undefined);
      const changes: Partial<SimpleChanges> = {
        path: {
          previousValue: undefined,
          currentValue: [["One", "Two"]],
          firstChange: false,
          isFirstChange(): boolean {
            return false;
          }
        }
      };
      const setColorsMock = jest.fn();
      const geometry: Partial<LineGeometry> = {
        setColors: setColorsMock
      }
      const object: Partial<Line2> = {
        geometry: geometry as LineGeometry,
        material: undefined,
        userData: {
          systems: ["One", "Two"]
        },
        type: 'Line2'
      };
      jest.replaceProperty(
        component.scene,
        'children',
        [object as Object3D]);

      component.ngOnChanges(changes as SimpleChanges);
      expect(object.material).not.toBeUndefined();
    });

    it('should color lines (reversed) if there is a current value for paths', function () {
      const getObjectByNameSpy = jest.spyOn(component.scene, 'getObjectByName');
      getObjectByNameSpy.mockReturnValue(undefined);
      const changes: Partial<SimpleChanges> = {
        path: {
          previousValue: undefined,
          currentValue: [["Two", "One"]],
          firstChange: false,
          isFirstChange(): boolean {
            return false;
          }
        }
      };
      const setColorsMock = jest.fn();
      const geometry: Partial<LineGeometry> = {
        setColors: setColorsMock
      }
      const object: Partial<Line2> = {
        geometry: geometry as LineGeometry,
        material: undefined,
        userData: {
          systems: ["One", "Two"]
        },
        type: 'Line2'
      };
      jest.replaceProperty(
        component.scene,
        'children',
        [object as Object3D]);

      component.ngOnChanges(changes as SimpleChanges);
      expect(object.material).not.toBeUndefined();
    });
  });

  it('should unselect the star system', function () {
    const removeSpy = jest.spyOn(component.selectedSystemLabel, 'removeFromParent')
      .mockImplementation();
    const object = new Object3D();
    const material = new MeshBasicMaterial();
    object.userData = {
      originalMaterial: material
    }
    component.clickCurrent = new Object3D();
    component.unselectStarSystem(object);

    expect(component.clickCurrent).toBeNull();
    expect((object as Mesh).material).toEqual(material);
    expect(removeSpy).toHaveBeenCalled();
  });

  it('should have an animate function', () => {
    const updateSpy = jest.spyOn(component.controls, 'update');
    const renderSpy = jest.spyOn(component.renderer, 'render');

    component.animate()

    expect(updateSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalledWith(component.scene, component.camera);
  });

  it('should have a coordinate limit property', () => {
    const expected = 3;
    expect(component.coordinateLimit).toEqual(expected);
  });

  it('should create the scene', () => {
    expect(component.createScene()).toBeInstanceOf(Scene);
  });

  it('should create the camera', () => {
    const camera = component.createCamera();
    expect(camera).toBeInstanceOf(Camera);
  });

  it('should initialize the camera', () => {
    const camera = new OrthographicCamera();
    component.initCamera(camera);
    expect(camera.position.z).toEqual(6);
  });

  it('should create the renderer', () => {
    const renderer = component.createRenderer();
    expect(renderer).toBeInstanceOf(Object);
  });

  // TODO: Refactor to make this test work. In fact, most of the mocking here is pretty awful.
  // it('should initialize the renderer', () => {
  //   const renderer = new WebGLRenderer();
  //   component.initRenderer(renderer);
  //   expect(renderer.domElement).toEqual("Thing");
  // });

  it('should create trackball controls', () => {
    const camera = new OrthographicCamera();
    expect(component.createControls(camera)).toBeInstanceOf(TrackballControls);
  });

  // TODO: Refactor to make this test work. In fact, most of the mocking here is pretty awful.
  // it('should initialize controls', function () {
  //   const camera = new OrthographicCamera();
  //   const controls = new TrackballControls(camera);
  //   const renderer = new WebGLRenderer();
  //   const connectSpy = jest.spyOn(controls, 'connect');
  //   const handleResize = jest.spyOn(controls, 'handleResize');
  //
  //   expect(controls.domElement).toEqual(renderer.domElement);
  //   expect(connectSpy).toHaveBeenCalled();
  //   expect(handleResize).toHaveBeenCalled();
  // });

  it('should create a raycaster', () => {
    expect(component.createRaycaster()).toBeInstanceOf(Raycaster);
  });

  describe('addStars function', () => {
    it('should add all star systems from the service', () => {
      const scene = new Scene();
      const addSpy = jest.spyOn(scene, 'add');
      component.addStars(scene);
      expect(addSpy).toHaveBeenCalledTimes(6);
    });

    it('should be a sphere of the defined radius', () => {
      const scene = new Scene();
      const addSpy = jest.spyOn(scene, 'add');
      component.addStars(scene);
      const addedStars = addSpy.mock.calls
        .filter(objects => {
          const mesh = objects[0] as Mesh;
          const geometry = mesh.geometry as SphereGeometry;
          return geometry.parameters.radius === 0.1;
        })
      expect(addedStars.length).toEqual(6);
    });

    it('should use a yellow material for Sol', () => {
      const scene = new Scene();
      const addSpy = jest.spyOn(scene, 'add');
      component.addStars(scene);
      const addedStars = addSpy.mock.calls
        .filter(objects => {
          const mesh = objects[0] as Mesh;
          const material = mesh.material as MeshBasicMaterial;
          return material.color.getHex() === 0xffff00;
        });
      expect(addedStars.length).toEqual(1);
    });

    it('should use a white material for other stars', () => {
      const scene = new Scene();
      const addSpy = jest.spyOn(scene, 'add');
      component.addStars(scene);
      const addedStars = addSpy.mock.calls
        .filter(objects => {
          const mesh = objects[0] as Mesh;
          const material = mesh.material as MeshBasicMaterial;
          return material.color.getHex() === 0xffffff;
        });
      expect(addedStars.length).toEqual(5);
    });
  });

  describe('addJumpLinks function', () => {
    it('should add all jump links from the service', () => {
      const scene = new Scene();
      const addSpy = jest.spyOn(scene, 'add');
      component.addJumpLinks(scene);
      expect(addSpy).toHaveBeenCalledTimes(5);
    });

    it('should color the jump link based on the jump level', () => {
      const scene = new Scene();
      const addSpy = jest.spyOn(scene, 'add');
      component.addJumpLinks(scene);
      const jumpLinks = new Map();
      addSpy.mock.calls
        .forEach(objects => {
          const line = objects[0] as Line;
          const material = line.material as LineBasicMaterial;
          jumpLinks.set(
            material.color.getHexString(),
            jumpLinks.get(material.color.getHexString()) + 1 || 1);
        });
      expect(jumpLinks.get('ff8080')).toEqual(1);
      expect(jumpLinks.get('ffd280')).toEqual(1);
      expect(jumpLinks.get('ffff80')).toEqual(1);
      expect(jumpLinks.get('80ff80')).toEqual(1);
      expect(jumpLinks.get('8080ff')).toEqual(1);
    });
  });

  it('should update the click location', () => {
    const htmlElement = component.container();
    jest.spyOn(component, 'container').mockImplementation(() => {
      return {
        ...htmlElement,
        getBoundingClientRect: () => {
          return {
            ...htmlElement.getBoundingClientRect(),
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0
          }
        }
      }
    });

    const mouseEvent = new MouseEvent('click', {clientX: 11, clientY: 42})
    component.click(mouseEvent);
    const expected = new Vector2(-0.78, 0.16);
    expect(component.clickLocation?.x).toBeCloseTo(expected.x);
    expect(component.clickLocation?.y).toBeCloseTo(expected.y);

    jest.restoreAllMocks();
  });

  it('should update the right click (context menu) location', () => {
    const htmlElement = component.container();
    jest.spyOn(component, 'container').mockImplementation(() => {
      return {
        ...htmlElement,
        getBoundingClientRect: () => {
          return {
            ...htmlElement.getBoundingClientRect(),
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0
          }
        }
      }
    });

    const mouseEvent = new MouseEvent('contextmenu', {clientX: 11, clientY: 42})
    component.rightClick(mouseEvent);
    const expected = new Vector2(-0.78, 0.16);
    expect(component.rightClickLocation?.x).toBeCloseTo(expected.x);
    expect(component.rightClickLocation?.y).toBeCloseTo(expected.y);

    jest.restoreAllMocks();
  });

  it('should update the mouseDown location', () => {
    const htmlElement = component.container();
    jest.spyOn(component, 'container').mockImplementation(() => {
      return {
        ...htmlElement,
        getBoundingClientRect: () => {
          return {
            ...htmlElement.getBoundingClientRect(),
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0
          }
        }
      }
    });

    const mouseEvent = new MouseEvent('click', {clientX: 11, clientY: 42})
    component.mouseDown(mouseEvent);
    const expected = new Vector2(-0.78, 0.16);
    expect(component.mouseDownLocation?.x).toBeCloseTo(expected.x);
    expect(component.mouseDownLocation?.y).toBeCloseTo(expected.y);

    jest.restoreAllMocks();
  });

  it('should update the pointerMove location', () => {
    const htmlElement = component.container();
    jest.spyOn(component, 'container').mockImplementation(() => {
      return {
        ...htmlElement,
        getBoundingClientRect: () => {
          return {
            ...htmlElement.getBoundingClientRect(),
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0
          }
        }
      }
    });

    const pointerEvent = new MouseEvent("pointermove", {clientX: 11, clientY: 42});
    component.pointerMove(pointerEvent as PointerEvent);
    const expected = new Vector2(-0.78, 0.16);
    expect(component.hoverLocation?.x).toBeCloseTo(expected.x);
    expect(component.hoverLocation?.y).toBeCloseTo(expected.y);

    jest.restoreAllMocks();
  });

  it('should update the scene when the window is resized', function () {
    const htmlElement = component.container();
    jest.spyOn(component, 'container').mockImplementation(() => {
      return {
        ...htmlElement,
        getBoundingClientRect: () => {
          return {
            ...htmlElement.getBoundingClientRect(),
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
            x: 0,
            y: 0
          }
        }
      }
    });

    jest.restoreAllMocks();

    const setCameraProjectionMatrixSpy = jest.spyOn(component, 'setCameraProjectionMatrix');
    const handleResize = jest.spyOn(component.controls, 'handleResize');

    component.windowResize();

    expect(setCameraProjectionMatrixSpy).toHaveBeenCalled();
    expect(handleResize).toHaveBeenCalled();
  });

  describe('addRightClickEffect function', function () {
    let raycasterSpy: jest.SpyInstance;

    const meshTarget = new Mesh();
    const intersections: Intersection[] = [
      {
        distance: 1,
        point: new Vector3(),
        object: meshTarget
      },
      {
        distance: 1,
        point: new Vector3(),
        object: new Line()
      }
    ];

    beforeEach(function () {
      component.mouseDownLocation = new Vector2();
      component.rightClickLocation = new Vector2();

      raycasterSpy = jest.spyOn(component.raycaster, 'intersectObjects');
    });

    describe('with a valid right click target and current right click object', function () {
      beforeEach(function () {
        raycasterSpy.mockReturnValue(intersections);
        component.mouseDownLocation = new Vector2();
        component.rightClickLocation = new Vector2();
      });

      it('should emit an undefined destination star system if target and object are equal', function () {
        component.clickDestCurrent = intersections[0].object;
        component.destStarSystemChange.subscribe({
          next: (value: StarSystem) => expect(value).toBeUndefined()
        });
        component.addRightClickEffect();
      });

      it('should emit a new destination star system if target and object are not equal', function () {
        component.clickDestCurrent = new Mesh();
        component.destStarSystemChange.subscribe({
          next: (value: StarSystem) => expect(value).toEqual(starSystemServiceReturnValue[0]),
        });
        component.addRightClickEffect();
      });
    });

    it('should emit a new destination star system if valid right click target and no current right click object', function () {
      component.clickDestCurrent = null
      component.destStarSystemChange.subscribe({
        next: (value: StarSystem) => expect(value).toEqual(starSystemServiceReturnValue[0]),
      });
      component.addRightClickEffect();
    });
  });

  describe('addClickEffect function', function () {
    let raycasterSpy: jest.SpyInstance;
    let selectStarSystemSpy: jest.SpyInstance;
    let unselectStarSystemSpy: jest.SpyInstance;

    const meshTarget = new Mesh();

    const intersections: Intersection[] = [
      {
        distance: 1,
        point: new Vector3(),
        object: meshTarget
      },
      {
        distance: 1,
        point: new Vector3(),
        object: new Line()
      }
    ];

    beforeEach(function () {
      component.mouseDownLocation = new Vector2();
      component.clickLocation = new Vector2();

      raycasterSpy = jest.spyOn(component.raycaster, 'intersectObjects');
      selectStarSystemSpy = jest.spyOn(component, 'selectStarSystem');
      unselectStarSystemSpy = jest.spyOn(component, 'unselectStarSystem');
    });

    it('should do nothing if no mouseDown intersections are found', function () {
      raycasterSpy.mockImplementationOnce(() => []);
      raycasterSpy.mockImplementationOnce(() => intersections);
      component.addClickEffect();
      expect(selectStarSystemSpy).not.toHaveBeenCalled();
      expect(unselectStarSystemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if no clickIntersections are found', function () {
      raycasterSpy.mockImplementationOnce(() => intersections);
      raycasterSpy.mockImplementationOnce(() => []);
      component.addClickEffect();
      expect(selectStarSystemSpy).not.toHaveBeenCalled();
      expect(unselectStarSystemSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if the two intersected objects are different', function () {
      raycasterSpy.mockImplementationOnce(() => intersections);
      raycasterSpy.mockImplementationOnce(() => [{
        distance: 1,
        point: new Vector3(),
        object: new Mesh()
      }]);
      component.addClickEffect();
      expect(selectStarSystemSpy).not.toHaveBeenCalled();
      expect(unselectStarSystemSpy).not.toHaveBeenCalled();
    });

    describe('with a currently selected object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('should set the material to hover and clear the selection if the target is the selected object', function () {
        component.clickCurrent = meshTarget;
        component.addClickEffect();
        expect(selectStarSystemSpy).not.toHaveBeenCalled();
        expect(unselectStarSystemSpy).not.toHaveBeenCalled();
      });

      it('should reset the original material, change the selection, and set the selected material', function () {
        component.clickCurrent = new Mesh();
        component.addClickEffect();
        expect(selectStarSystemSpy).not.toHaveBeenCalled();
        expect(unselectStarSystemSpy).not.toHaveBeenCalled();
      });
    });

    describe('without a currently selected object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('should set the selected object to the target object and change the material', function () {
        component.clickCurrent = null;
        component.addClickEffect();
        expect(selectStarSystemSpy).not.toHaveBeenCalled();
        expect(unselectStarSystemSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('addHoverEffect function', function () {
    let unhoverSpy: jest.SpyInstance;
    let hoverSpy: jest.SpyInstance;
    let raycasterSpy: jest.SpyInstance;

    const meshTarget = new Mesh();
    const intersections: Intersection[] = [
      {
        distance: 1,
        point: new Vector3(),
        object: meshTarget
      },
      {
        distance: 1,
        point: new Vector3(),
        object: new Line()
      }
    ];

    beforeEach(function () {
      component.hoverLocation = new Vector2();

      unhoverSpy = jest.spyOn(component, 'unhoverStarSystem');
      hoverSpy = jest.spyOn(component, 'hoverStarSystem');
      raycasterSpy = jest.spyOn(component.raycaster, 'intersectObjects');
    });

    describe('with intersections and a currently hovered object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('with previous not selected and target selected, should reset previous material and only set variable', function () {
        component.hoverCurrent = new Mesh();
        component.clickCurrent = meshTarget;
        component.addHoverEffect();
        expect(unhoverSpy).toHaveBeenCalled();
        expect(hoverSpy).not.toHaveBeenCalled();
        expect(component.hoverCurrent).toEqual(meshTarget);
      });

      it('with previous selected and target not selected, should do nothing to previous and set target material', function () {
        component.hoverCurrent = new Mesh();
        component.clickCurrent = component.hoverCurrent;
        component.addHoverEffect();
        expect(unhoverSpy).not.toHaveBeenCalled();
        expect(hoverSpy).toHaveBeenCalled();
        expect(component.hoverCurrent).toEqual(meshTarget);
      });

      it('should reset previous material and set target material', function () {
        component.hoverCurrent = new Mesh();
        component.clickCurrent = null;
        component.addHoverEffect();
        expect(unhoverSpy).toHaveBeenCalled();
        expect(hoverSpy).toHaveBeenCalled();
        expect(component.hoverCurrent).toEqual(meshTarget);
      });
    });

    describe('with intersections and no currently hovered object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('with target selected, should only set variable', function () {
        component.hoverCurrent = null;
        component.clickCurrent = meshTarget;
        component.addHoverEffect();
        expect(unhoverSpy).not.toHaveBeenCalled();
        expect(hoverSpy).not.toHaveBeenCalled();
        expect(component.hoverCurrent).toEqual(meshTarget);
      });

      it('with target not selected, should set target material', function () {
        component.hoverCurrent = null;
        component.clickCurrent = null;
        component.addHoverEffect();
        expect(unhoverSpy).not.toHaveBeenCalled();
        expect(hoverSpy).toHaveBeenCalled();
        expect(component.hoverCurrent).toEqual(meshTarget);
      });
    });

    describe('with no intersections a currently hovered object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => []);
      });

      it('with current selected, should only set variable', function () {
        component.hoverCurrent = new Mesh();
        component.clickCurrent = component.hoverCurrent;
        component.addHoverEffect();
        expect(unhoverSpy).not.toHaveBeenCalled();
        expect(hoverSpy).not.toHaveBeenCalled();
        expect(component.hoverCurrent).toBeNull();
      });

      it('with current not selected, should restore previous material', function () {
        component.hoverCurrent = new Mesh();
        component.clickCurrent = new Mesh();
        component.addHoverEffect();
        expect(unhoverSpy).toHaveBeenCalled();
        expect(hoverSpy).not.toHaveBeenCalled();
        expect(component.hoverCurrent).toBeNull();
      });
    });
  });
});
