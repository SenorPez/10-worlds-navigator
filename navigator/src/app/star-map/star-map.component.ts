import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import * as THREE from 'three';
import {StarSystemService} from "../star-system.service";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import * as _ from 'lodash';
import {CSS2DObject, CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {StarSystem} from "../star-system";
import {Line2} from "three/examples/jsm/lines/Line2";
import {LineGeometry} from "three/examples/jsm/lines/LineGeometry";
import {LineMaterial} from "three/examples/jsm/lines/LineMaterial";

@Component({
  selector: 'app-star-map',
  standalone: true,
  imports: [],
  templateUrl: './star-map.component.html',
  styleUrl: './star-map.component.css',
  encapsulation: ViewEncapsulation.None
})
export class StarMapComponent implements OnChanges, OnInit, AfterViewInit {
  scene;
  camera;
  renderer;
  labelRenderer;
  controls;

  selectedSystemDiv;
  selectedSystemLabel;

  selectedDestSystemDiv;
  selectedDestSystemLabel;

  @Input() starSystem!: StarSystem | undefined;
  @Input() destStarSystem!: StarSystem | undefined;

  @Output() starSystemChange = new EventEmitter<StarSystem>();
  @Output() destStarSystemChange = new EventEmitter<StarSystem>();

  @Input() jumpLevels!: string[];
  @Input() path!: string[][];

  hoveredSystemDiv;
  hoveredSystemLabel;

  raycaster;
  hoverLocation: THREE.Vector2 | null = null;
  clickLocation: THREE.Vector2 | null = null;
  rightClickLocation: THREE.Vector2 | null = null;
  mouseDownLocation: THREE.Vector2 | null = null

  hoverMaterial = new THREE.MeshBasicMaterial({color: 0xffaaaa})
  clickMaterial = new THREE.MeshBasicMaterial({color: 0xff0000})
  destMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff})

  restoreMaterial = (object: THREE.Mesh) => object.material = object.userData['originalMaterial'];

  hoverCurrent: THREE.Object3D | null = null;
  clickCurrent: THREE.Object3D | null = null;
  clickDestCurrent: THREE.Object3D | null = null;

  container = () => document.getElementById("divCanvas") ?? document.body;
  coordinateLimit = Math.max(...this.starSystemsService.getStarSystems()
    .map(starSystem => new THREE.Vector3(
      starSystem.coordinates.x,
      starSystem.coordinates.y,
      starSystem.coordinates.z
    ).length()));


  constructor(private starSystemsService: StarSystemService) {
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.labelRenderer = this.createLabelRenderer();
    this.controls = this.createControls(this.camera);
    this.raycaster = this.createRaycaster();

    this.selectedSystemDiv = document.createElement('div');
    this.selectedSystemLabel = new CSS2DObject(this.selectedSystemDiv);
    this.selectedDestSystemDiv = document.createElement('div');
    this.selectedDestSystemLabel = new CSS2DObject(this.selectedDestSystemDiv);
    this.hoveredSystemDiv = document.createElement('div');
    this.hoveredSystemLabel = new CSS2DObject(this.hoveredSystemDiv);
  }

  ngOnChanges(changes: SimpleChanges) {
    const previousSystem = this.scene.getObjectByName(changes['starSystem']?.previousValue?.name);
    if (previousSystem) {
      this.unselectStarSystem(previousSystem);
    }

    const currentSystem = this.scene.getObjectByName(changes['starSystem']?.currentValue?.name);
    if (currentSystem) {
      this.selectStarSystem(currentSystem);
    }

    const previousDestSystem = this.scene.getObjectByName(changes['destStarSystem']?.previousValue?.name);
    if (previousDestSystem) {
      this.unselectDestStarSystem(previousDestSystem);
    }

    const currentDestSystem = this.scene.getObjectByName(changes['destStarSystem']?.currentValue?.name);
    if (currentDestSystem) {
      this.selectDestStarSystem(currentDestSystem);
    }

    if (changes['jumpLevels']) {
      changes['jumpLevels'].currentValue.includes("Alpha") ?
        this.camera.layers.enable(1) : this.camera.layers.disable(1);
      changes['jumpLevels'].currentValue.includes("Beta") ?
        this.camera.layers.enable(2) : this.camera.layers.disable(2);
      changes['jumpLevels'].currentValue.includes("Gamma") ?
        this.camera.layers.enable(3) : this.camera.layers.disable(3);
      changes['jumpLevels'].currentValue.includes("Delta") ?
        this.camera.layers.enable(4) : this.camera.layers.disable(4);
      changes['jumpLevels'].currentValue.includes("Epsilon") ?
        this.camera.layers.enable(5) : this.camera.layers.disable(5);
    }

    if (changes['path']) {
      if (changes['path'].previousValue) {
        let previousSystem: string | null = null;
        const currentPaths: string[][] = changes['path'].previousValue;
        currentPaths.forEach(path => {
          path.forEach(system => {
            if (previousSystem === null) previousSystem = system;
            else {
              const objects = this.scene.children.filter(object => {
                return object.type === 'Line2' &&
                  object.userData['systems'].includes(previousSystem) &&
                  object.userData['systems'].includes(system);
              });
              objects.forEach(obj => {
                (obj as Line2).material = obj.userData['originalMaterial'];
              });

              previousSystem = system;
            }
          })
        })
      }

      if (changes['path'].currentValue) {
        let previousSystem: string | null = null;
        const currentPaths: string[][] = changes['path'].currentValue;
        currentPaths.forEach(path => {
          path.forEach(system => {
            if (previousSystem === null) previousSystem = system;
            else {
              const objects = this.scene.children.filter(object => {
                return object.type === 'Line2' &&
                  object.userData['systems'].includes(previousSystem) &&
                  object.userData['systems'].includes(system);
              });
              objects.forEach(obj => {
                if (obj.userData['systems'][0] === system) {
                  (obj as Line2).geometry.setColors([1, 1, 1, 0, 0, 0]);
                } else {
                  (obj as Line2).geometry.setColors([0, 0, 0, 1, 1, 1]);
                }
                (obj as Line2).material = new LineMaterial({
                  color: 0xff0000,
                  linewidth: 5,
                  vertexColors: true
                });
              });

              previousSystem = system;
            }
          });
        });
      }
    }
  }

  ngOnInit() {
    this.initCamera(this.camera);
    this.initRenderer(this.renderer);
    this.initLabelRenderer(this.labelRenderer);
    this.initControls(this.controls, this.labelRenderer);

    this.addStars(this.scene);
    this.addJumpLinks(this.scene);

    if (this.starSystem?.name) {
      const object = this.scene.getObjectByName(this.starSystem.name);
      if (object) {
        this.selectStarSystem(object);
      }
    }

    this.selectedSystemLabel.center.set(0, 0);
    this.selectedDestSystemLabel.center.set(0, 0);
    this.hoveredSystemLabel.center.set(0, 0);

    this.renderer.setAnimationLoop(this.animate);
  }

  ngAfterViewInit() {
    this.windowResize();
  }

  createScene = () => new THREE.Scene();
  createCamera = () => new THREE.OrthographicCamera();
  createRenderer = () => new THREE.WebGLRenderer();
  createLabelRenderer = () => new CSS2DRenderer();
  createControls = (camera: THREE.Camera) => new TrackballControls(camera);
  createRaycaster = () => new THREE.Raycaster();

  initCamera(camera: THREE.Camera) {
    camera.position.z = this.coordinateLimit * 2;
    this.setCameraProjectionMatrix(camera as THREE.OrthographicCamera);
  }

  initRenderer(renderer: THREE.WebGLRenderer) {
    const container = this.container();

    container.appendChild(renderer.domElement);
  }

  initLabelRenderer(labelRenderer: CSS2DRenderer) {
    const container = this.container();

    container.appendChild(labelRenderer.domElement);
    labelRenderer.domElement.id = "systemLabel";
  }

  initControls(controls: TrackballControls, renderer: CSS2DRenderer) {
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.handleResize();
  }

  animate = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  setCameraProjectionMatrix(camera: THREE.OrthographicCamera) {
    const container = this.container();

    const aspectRatio = container.getBoundingClientRect().width / container.getBoundingClientRect().height;
    const coordinateLimit = this.coordinateLimit * 1.05;

    camera.left = aspectRatio > 1 ? -coordinateLimit * aspectRatio : -coordinateLimit;
    camera.right = aspectRatio > 1 ? coordinateLimit * aspectRatio : coordinateLimit;
    camera.top = aspectRatio > 1 ? coordinateLimit : coordinateLimit / aspectRatio;
    camera.bottom = aspectRatio > 1 ? -coordinateLimit : -coordinateLimit / aspectRatio;
    camera.near = 0.1;
    camera.far = 100;

    camera.updateProjectionMatrix();
  }

  click(event: MouseEvent) {
    const container = this.container();

    this.clickLocation = new THREE.Vector2(
      ((event.clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width) * 2 - 1,
      -((event.clientY - container.getBoundingClientRect().top) / container.getBoundingClientRect().height) * 2 + 1
    );
    this.addClickEffect();
  }

  rightClick(event: MouseEvent) {
    const container = this.container();

    this.rightClickLocation = new THREE.Vector2(
      ((event.clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width) * 2 - 1,
      -((event.clientY - container.getBoundingClientRect().top) / container.getBoundingClientRect().height) * 2 + 1
    );
    this.addRightClickEffect();
  }

  mouseDown(event: MouseEvent) {
    const container = this.container();

    this.mouseDownLocation = new THREE.Vector2(
      ((event.clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width) * 2 - 1,
      -((event.clientY - container.getBoundingClientRect().top) / container.getBoundingClientRect().height) * 2 + 1
    );
  }

  pointerMove(event: PointerEvent) {
    const container = this.container();

    this.hoverLocation = new THREE.Vector2(
      ((event.clientX - container.getBoundingClientRect().left) / container.getBoundingClientRect().width) * 2 - 1,
      -((event.clientY - container.getBoundingClientRect().top) / container.getBoundingClientRect().height) * 2 + 1
    );
    this.addHoverEffect();
  }

  windowResize() {
    const leftColumn = document.getElementById("leftColumn") ?? document.body;

    this.renderer.setSize(
      window.innerWidth - leftColumn.getBoundingClientRect().width,
      window.innerHeight
    );
    this.labelRenderer.setSize(
      window.innerWidth - leftColumn.getBoundingClientRect().width,
      window.innerHeight
    );

    this.setCameraProjectionMatrix(this.camera);
    this.controls.handleResize();
  }

  hoverStarSystem(starSystem: THREE.Object3D) {
    this.hoverCurrent = starSystem;
    (starSystem as THREE.Mesh).material = this.hoverMaterial;
    const selectedSystem = starSystem.name ?? "SYSTEM";
    this.hoveredSystemDiv.innerHTML = `<div class='hoveredSystem'>${selectedSystem}</div>`;
    starSystem.add(this.hoveredSystemLabel);
  }

  selectStarSystem(starSystem: THREE.Object3D) {
    this.clickCurrent = starSystem;
    (starSystem as THREE.Mesh).material = this.clickMaterial;
    const selectedSystem = starSystem.name ?? "SYSTEM";
    this.selectedSystemDiv.innerHTML = `<div class='selectedSystem'>${selectedSystem}</div>`;
    starSystem.add(this.selectedSystemLabel);
  }

  selectDestStarSystem(starSystem: THREE.Object3D) {
    this.clickDestCurrent = starSystem;
    (starSystem as THREE.Mesh).material = this.destMaterial;
    const selectedSystem = starSystem.name ?? "SYSTEM";
    this.selectedDestSystemDiv.innerHTML = `<div class='selectedSystem'>${selectedSystem}</div>`;
    starSystem.add(this.selectedDestSystemLabel);
  }

  unhoverStarSystem(starSystem: THREE.Object3D) {
    this.hoverCurrent = null;
    this.restoreMaterial(starSystem as THREE.Mesh);
    this.hoveredSystemLabel.removeFromParent();
  }

  unselectStarSystem(starSystem: THREE.Object3D) {
    this.clickCurrent = null;
    this.restoreMaterial(starSystem as THREE.Mesh);
    this.selectedSystemLabel.removeFromParent();
  }

  unselectDestStarSystem(starSystem: THREE.Object3D) {
    this.clickDestCurrent = null;
    this.restoreMaterial(starSystem as THREE.Mesh);
    this.selectedDestSystemLabel.removeFromParent();
  }

  addStars(scene: THREE.Scene) {
    const starGeometry = new THREE.SphereGeometry(0.1);
    this.starSystemsService.getStarSystems()
      .forEach(starSystem => {
        const starMaterial = starSystem.name === "Sol" ?
          new THREE.MeshBasicMaterial({color: 0xffff00}) :
          new THREE.MeshBasicMaterial({color: 0xffffff});
        const starMesh = new THREE.Mesh(starGeometry, starMaterial);
        starMesh.position.set(
          starSystem.coordinates.x,
          starSystem.coordinates.y,
          starSystem.coordinates.z
        );
        starMesh.userData = {
          starSystemName: starSystem.name,
          originalMaterial: starMaterial
        };
        starMesh.name = starSystem.name;
        scene.add(starMesh);
      });
  }

  addJumpLinks(scene: THREE.Scene) {
    const jumpLinks = this.starSystemsService.getStarSystems()
      .flatMap(starSystem => {
        const origin = new THREE.Vector3(
          starSystem.coordinates.x,
          starSystem.coordinates.y,
          starSystem.coordinates.z
        );

        return starSystem.jumpLinks
          .filter(jumpLink => jumpLink.discovered !== null)
          .map(jumpLink => {
            return {
              jumpLevel: jumpLink.jumpLevel,
              systems: [jumpLink.destination, starSystem.name],
              coordinates: this.starSystemsService.getStarSystems()
                .find(starSystem => starSystem.name === jumpLink.destination)
                ?.coordinates
            };
          })
          .filter((jumpLink): jumpLink is {
            jumpLevel: string,
            systems: [string, string],
            coordinates: { x: number, y: number, z: number }
          } => jumpLink.coordinates !== undefined)
          .map(jumpLink => {
            const destination = new THREE.Vector3(
              jumpLink.coordinates.x,
              jumpLink.coordinates.y,
              jumpLink.coordinates.z
            );

            return {jumpLevel: jumpLink.jumpLevel, systems: jumpLink.systems, origin: origin, destination: destination};
          });
      });

    _.uniqWith(jumpLinks, (a, b) => {
      return a.origin.equals(b.destination) && b.origin.equals(a.destination);
    })
      .forEach(jumpLink => {
        let lineMaterial;
        let lineLayer = 0;
        switch (jumpLink.jumpLevel) {
          case "Alpha":
            lineMaterial = new LineMaterial({color: 0xff8080, linewidth: 2});
            lineLayer = 1;
            break;
          case "Beta":
            lineMaterial = new LineMaterial({color: 0xffd280, linewidth: 2});
            lineLayer = 2;
            break;
          case "Gamma":
            lineMaterial = new LineMaterial({color: 0xffff80, linewidth: 2});
            lineLayer = 3;
            break;
          case "Delta":
            lineMaterial = new LineMaterial({color: 0x80ff80, linewidth: 2});
            lineLayer = 4;
            break;
          case "Epsilon":
            lineMaterial = new LineMaterial({color: 0x8080ff, linewidth: 2});
            lineLayer = 5;
            break;
        }

        const geometry = new LineGeometry();
        geometry.setPositions([
          jumpLink.origin.x, jumpLink.origin.y, jumpLink.origin.z,
          jumpLink.destination.x, jumpLink.destination.y, jumpLink.destination.z
        ]);
        geometry.setColors([1, 1, 1, 1, 1, 1]);

        const line = new Line2(geometry, lineMaterial);
        line.userData = {
          systems: jumpLink.systems,
          originalMaterial: lineMaterial
        };
        line.layers.set(lineLayer);
        scene.add(line);
      });
  }

  addClickEffect() {
    if (this.mouseDownLocation !== null && this.clickLocation !== null) {
      this.raycaster.setFromCamera(this.mouseDownLocation, this.camera);
      const mouseDownIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");
      this.raycaster.setFromCamera(this.clickLocation, this.camera);
      const clickIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      if (
        mouseDownIntersections.length > 0 &&
        clickIntersections.length > 0 &&
        _.isEqual(mouseDownIntersections[0].object, clickIntersections[0].object)
      ) {
        const targetObject = clickIntersections[0].object;
        let starSystem = this.starSystemsService.getStarSystem(targetObject.name);
        if (this.clickCurrent !== null) {
          if (this.clickCurrent.uuid === targetObject.uuid) {
            this.starSystemChange.emit(undefined);
          } else {
            this.starSystemChange.emit(starSystem);
          }
        } else {
          this.starSystemChange.emit(starSystem);
        }
      }
    }
  }

  addRightClickEffect() {
    if (this.mouseDownLocation !== null && this.rightClickLocation !== null) {
      this.raycaster.setFromCamera(this.mouseDownLocation, this.camera);
      const mouseDownIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");
      this.raycaster.setFromCamera(this.rightClickLocation, this.camera);
      const clickIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      if (
        mouseDownIntersections.length > 0 &&
        clickIntersections.length > 0 &&
        _.isEqual(mouseDownIntersections[0].object, clickIntersections[0].object)
      ) {
        const targetObject = clickIntersections[0].object;
        let starSystem = this.starSystemsService.getStarSystem(targetObject.name);
        if (this.clickDestCurrent !== null) {
          if (this.clickDestCurrent.uuid === targetObject.uuid) {
            this.destStarSystemChange.emit(undefined);
          } else {
            this.destStarSystemChange.emit(starSystem);
          }
        } else {
          this.destStarSystemChange.emit(starSystem);
        }
      }
    }
  }

  addHoverEffect() {
    if (this.hoverLocation !== null) {
      this.raycaster.setFromCamera(this.hoverLocation, this.camera);
      const hoverIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      if (hoverIntersections.length > 0) {
        const targetObject = hoverIntersections[0].object;
        if (this.hoverCurrent !== null) {
          if (this.hoverCurrent.uuid !== targetObject.uuid) {
            if (
              (this.clickCurrent !== null && this.clickCurrent.uuid === targetObject.uuid) ||
              (this.clickDestCurrent !== null && this.clickDestCurrent.uuid === targetObject.uuid)
            ) {
              // Don't assign new material or add callout as we're hovering the selected object.
              this.unhoverStarSystem(this.hoverCurrent);
              this.hoverCurrent = targetObject;
            } else if (
              (this.clickCurrent !== null && this.clickCurrent.uuid === this.hoverCurrent.uuid) ||
              (this.clickDestCurrent !== null && this.clickDestCurrent.uuid === this.clickDestCurrent.uuid)
            ) {
              // Don't restore original material as it's selected.
              this.hoverStarSystem(targetObject);
            } else {
              // Restore original material and then hover new object.
              this.unhoverStarSystem(this.hoverCurrent);
              this.hoverStarSystem(targetObject);
            }
          }
        } else {
          if (
            (this.clickCurrent !== null && this.clickCurrent.uuid === targetObject.uuid) ||
            (this.clickDestCurrent !== null && this.clickDestCurrent.uuid === targetObject.uuid)
          ) {
            // Don't set a material as we're hovering the selected system.
            this.hoverCurrent = targetObject;
          } else {
            this.hoverStarSystem(targetObject);
          }
        }
      } else {
        if (this.hoverCurrent !== null) {
          if (
            (this.clickCurrent !== null && this.clickCurrent.uuid === this.hoverCurrent.uuid) ||
            (this.clickDestCurrent !== null && this.clickDestCurrent.uuid === this.hoverCurrent.uuid)
          ) {
            // Don't restore original material as it's selected.
            this.hoverCurrent = null;
          } else {
            this.unhoverStarSystem(this.hoverCurrent);
          }
        }
      }
    }
  }
}
