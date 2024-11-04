import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StarMapComponent} from './star-map.component';
import {StarSystem} from "../star-system";
import {StarSystemService} from "../star-system.service";
import {
  Intersection,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3
} from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";

let starSystemService: { getStarSystems: jest.Mock; };
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
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);

    const camera = component.createCamera();

    expect(camera).toBeInstanceOf(OrthographicCamera);
    expect(camera.left).toBeCloseTo(-3.15, 3);
    expect(camera.right).toBeCloseTo(3.15, 3);
    expect(camera.top).toBeCloseTo(3.15, 3);
    expect(camera.bottom).toBeCloseTo(-3.15, 3);
    expect(camera.near).toBeCloseTo(0.1, 3);
    expect(camera.far).toEqual(100);
  });

  it('should initialize the camera', () => {
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);
    const camera = new OrthographicCamera();
    component.initCamera(camera);
    expect(camera.position.z).toEqual(6);
  });

  it('should create the renderer', () => {
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);

    const renderer = component.createRenderer();

    expect(renderer.setSize).toHaveBeenCalledWith(500, 500);
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
      expect(addSpy).toHaveBeenCalledTimes(10);
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
      expect(jumpLinks.get('ff0000')).toEqual(2);
      expect(jumpLinks.get('ffff00')).toEqual(2);
      expect(jumpLinks.get('00ff00')).toEqual(2);
      expect(jumpLinks.get('00ffff')).toEqual(2);
      expect(jumpLinks.get('0000ff')).toEqual(2);
    });
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

  // it('should add a click effect if mouseDown is set and selects the same object', () => {
  //   jest.replaceProperty(window, "innerWidth", 500);
  //   jest.replaceProperty(window, "innerHeight", 500);
  //
  //   const object: Object3D = new Mesh();
  //   const intersection: Intersection = {
  //     distance: 42,
  //     point: new Vector3(3, 3, 3),
  //     object: object
  //   }
  //
  //   const raycasterSpy = jest.spyOn(component.raycaster, 'intersectObjects')
  //     .mockImplementation(() => [intersection]);
  //   const addClickEffect = jest.spyOn(component, 'addClickEffect');
  //
  //   component.mouseDownLocation = new Vector2(-0.956, 0.832);
  //   const mouseEvent = new MouseEvent('click', {clientX: 11, clientY: 42})
  //   component.click(mouseEvent);
  //   expect(addClickEffect).toHaveBeenCalledWith(intersection.object);
  // });

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

  it('should update the scene when the window is resized', function () {
    jest.replaceProperty(window, "innerWidth", 500);
    jest.replaceProperty(window, "innerHeight", 500);
    const updateProjectionMatrixSpy = jest.spyOn(component.camera, 'updateProjectionMatrix');
    const handleResize = jest.spyOn(component.controls, 'handleResize');

    component.windowResize();

    expect(component.camera.left).toBeCloseTo(-3.15, 3);
    expect(component.camera.right).toBeCloseTo(3.15, 3);
    expect(component.camera.top).toBeCloseTo(3.15, 3);
    expect(component.camera.bottom).toBeCloseTo(-3.15, 3);

    expect(updateProjectionMatrixSpy).toHaveBeenCalled();
    expect(handleResize).toHaveBeenCalled();
  });

  describe('addClickEffect function', function () {
    let raycasterSpy: jest.SpyInstance;
    let setMaterialSpy: jest.SpyInstance;
    let setClickCurrentSpy: jest.SpyInstance;

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
      setMaterialSpy = jest.spyOn(component, 'setMaterial');
      setClickCurrentSpy = jest.spyOn(component, 'setClickCurrent');
    });

    it('should do nothing if no mouseDown intersections are found', function () {
      raycasterSpy.mockImplementationOnce(() => []);
      raycasterSpy.mockImplementationOnce(() => intersections);
      component.addClickEffect();
      expect(setMaterialSpy).not.toHaveBeenCalled();
      expect(setClickCurrentSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if no clickIntersections are found', function () {
      raycasterSpy.mockImplementationOnce(() => intersections);
      raycasterSpy.mockImplementationOnce(() => []);
      component.addClickEffect();
      expect(setMaterialSpy).not.toHaveBeenCalled();
      expect(setClickCurrentSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if the two intersected objects are different', function () {
      raycasterSpy.mockImplementationOnce(() => intersections);
      raycasterSpy.mockImplementationOnce(() => [{
        distance: 1,
        point: new Vector3(),
        object: new Mesh()
      }]);
      component.addClickEffect();
      expect(setMaterialSpy).not.toHaveBeenCalled();
      expect(setClickCurrentSpy).not.toHaveBeenCalled();
    });

    describe('with a currently selected object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('should set the material to hover and clear the selection if the target is the selected object', function () {
        component.clickCurrent = {
          object: meshTarget,
          replacedMaterial: new MeshBasicMaterial()
        }
        component.addClickEffect();
        expect(setMaterialSpy).toHaveBeenCalledWith(
          meshTarget,
          component.hoverMaterial
        );
        expect(setClickCurrentSpy).not.toHaveBeenCalled();
        expect(component.clickCurrent).toBeNull();
      });

      it('should reset the original material, change the selection, and set the selected material', function () {
        const originalMesh = new Mesh();
        const originalMaterial = new MeshBasicMaterial();
        component.clickCurrent = {
          object: originalMesh,
          replacedMaterial: originalMaterial
        };
        component.addClickEffect();
        expect(setMaterialSpy).toHaveBeenNthCalledWith(1, originalMesh, originalMaterial);
        expect(setMaterialSpy).toHaveBeenNthCalledWith(2, meshTarget, component.clickMaterial);
        expect(setClickCurrentSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('without a currently selected object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('should set the selected object to the target object and change the material', function () {
        component.addClickEffect();
        expect(setMaterialSpy).toHaveBeenCalledTimes(1);
        expect(setClickCurrentSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
