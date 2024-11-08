import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StarMapComponent} from './star-map.component';
import {StarSystem} from "../star-system";
import {StarSystemService} from "../star-system.service";
import {
  Camera,
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
    starSystemService.getStarSystem.mockImplementation(name => starSystemServiceReturnValue[0]);

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
      expect(jumpLinks.get('ff0000')).toEqual(1);
      expect(jumpLinks.get('ffff00')).toEqual(1);
      expect(jumpLinks.get('00ff00')).toEqual(1);
      expect(jumpLinks.get('00ffff')).toEqual(1);
      expect(jumpLinks.get('0000ff')).toEqual(1);
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
    component.click(mouseEvent);
    const expected = new Vector2(-0.78, 0.16);
    expect(component.clickLocation?.x).toBeCloseTo(expected.x);
    expect(component.clickLocation?.y).toBeCloseTo(expected.y);

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

    const mouseEvent = new MouseEvent('click', {clientX: 11, clientY: 42})
    component.click(mouseEvent);
    const expected = new Vector2(-0.78, 0.16);
    expect(component.clickLocation?.x).toBeCloseTo(expected.x);
    expect(component.clickLocation?.y).toBeCloseTo(expected.y);

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
        component.clickCurrent = {
          object: meshTarget,
          replacedMaterial: new MeshBasicMaterial()
        }
        component.addClickEffect();
        expect(selectStarSystemSpy).not.toHaveBeenCalled();
        expect(unselectStarSystemSpy).not.toHaveBeenCalled();
      });

      it('should reset the original material, change the selection, and set the selected material', function () {
        const originalMesh = new Mesh();
        const originalMaterial = new MeshBasicMaterial();
        component.clickCurrent = {
          object: originalMesh,
          replacedMaterial: originalMaterial
        };
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
        component.addClickEffect();
        expect(selectStarSystemSpy).not.toHaveBeenCalled();
        expect(unselectStarSystemSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('addHoverEffect function', function () {
    let raycasterSpy: jest.SpyInstance;
    let setMaterialSpy: jest.SpyInstance;
    let setCurrentSpy: jest.SpyInstance;

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

      raycasterSpy = jest.spyOn(component.raycaster, 'intersectObjects');
      setMaterialSpy = jest.spyOn(component, 'setMaterial');
      setCurrentSpy = jest.spyOn(component, 'setCurrent');
    });

    // it('should do nothing if no hover intersections are found', function () {
    //   raycasterSpy.mockImplementation(() => []);
    //   component.addHoverEffect();
    //   expect(setMaterialSpy).not.toHaveBeenCalled();
    //   expect(setCurrentSpy).not.toHaveBeenCalled();
    // });

    describe('with intersections and a currently hovered object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('should do nothing if the target and current object are the same', function () {
        component.hoverCurrent = {
          object: meshTarget,
          replacedMaterial: new MeshBasicMaterial()
        }
        component.addHoverEffect();
        expect(setMaterialSpy).not.toHaveBeenCalled();
        expect(setCurrentSpy).not.toHaveBeenCalled();
      });

      it('should not restore the material if the current hover is selected and update the hover to the target ', function () {
        const material = new MeshBasicMaterial;
        const otherMesh = new Mesh();
        component.clickCurrent = {
          object: otherMesh,
          replacedMaterial: material
        };
        component.hoverCurrent = {
          object: otherMesh,
          replacedMaterial: material
        };
        component.addHoverEffect();
        expect(setMaterialSpy).toHaveBeenCalledTimes(1);
        expect(setCurrentSpy).toHaveBeenCalledTimes(1);
      });

      it('should not change the material if the target is selected', function () {
        const material = new MeshBasicMaterial;
        const otherMesh = new Mesh();
        component.clickCurrent = {
          object: meshTarget,
          replacedMaterial: material
        };
        component.hoverCurrent = {
          object: otherMesh,
          replacedMaterial: material
        };
        component.addHoverEffect();
        expect(setMaterialSpy).toHaveBeenCalledTimes(1);
        expect(setCurrentSpy).toHaveBeenCalledTimes(1);
      });

      it('should restore the previous hover and set the new hover', function () {
        const otherMesh = new Mesh();
        component.hoverCurrent = {
          object: otherMesh,
          replacedMaterial: new MeshBasicMaterial()
        }
        component.addHoverEffect();
        expect(setMaterialSpy).toHaveBeenCalledTimes(2);
        expect(setCurrentSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('with intersections and no currently hovered object', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => intersections);
      });

      it('should not change the material if its selected', function () {
        component.clickCurrent = {
          object: intersections[0].object,
          replacedMaterial: new MeshBasicMaterial()
        };
        component.addHoverEffect();
        expect(setMaterialSpy).not.toHaveBeenCalled();
        expect(setCurrentSpy).toHaveBeenCalledTimes(1);
      });

      it('should change the material if it is not selected', function () {
        component.addHoverEffect();
        expect(setMaterialSpy).toHaveBeenCalledTimes(1);
        expect(setCurrentSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('with no intersections', function () {
      beforeEach(function () {
        raycasterSpy.mockImplementation(() => []);
      });

      it('should not restore previous material if its selected', function () {
        const material = new MeshBasicMaterial;
        component.clickCurrent = {
          object: meshTarget,
          replacedMaterial: material
        };
        component.hoverCurrent = {
          object: meshTarget,
          replacedMaterial: material
        };
        component.addHoverEffect();
        expect(setMaterialSpy).not.toHaveBeenCalled();
        expect(setCurrentSpy).not.toHaveBeenCalled();
      });

      it('should restore previous material', function () {
        component.hoverCurrent = {
          object: meshTarget,
          replacedMaterial: new MeshBasicMaterial()
        };
        component.addHoverEffect();
        expect(setMaterialSpy).toHaveBeenCalledTimes(1);
        expect(setCurrentSpy).not.toHaveBeenCalled();
      });

      it('should do nothing if there is no previous', function () {
        component.addHoverEffect();
        expect(setMaterialSpy).not.toHaveBeenCalled();
        expect(setCurrentSpy).not.toHaveBeenCalled();
      });
    });
  });
});
