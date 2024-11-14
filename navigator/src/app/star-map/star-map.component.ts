import {
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

@Component({
  selector: 'app-star-map',
  standalone: true,
  imports: [],
  templateUrl: './star-map.component.html',
  styleUrl: './star-map.component.css',
  encapsulation: ViewEncapsulation.None
})
export class StarMapComponent implements OnChanges, OnInit {
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

  hoveredSystemDiv;
  hoveredSystemLabel;

  raycaster;
  hoverLocation: THREE.Vector2 | null = null;
  clickLocation: THREE.Vector2 | null = null;
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
    renderer.setSize(
      container.getBoundingClientRect().width,
      container.getBoundingClientRect().height
    );
  }

  initLabelRenderer(labelRenderer: CSS2DRenderer) {
    const container = this.container();

    container.appendChild(labelRenderer.domElement);
    labelRenderer.setSize(
      container.getBoundingClientRect().width,
      container.getBoundingClientRect().height
    )
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
    const container = this.container();

    this.renderer.setSize(
      container.getBoundingClientRect().width,
      container.getBoundingClientRect().height
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
              coordinates: this.starSystemsService.getStarSystems()
                .find(starSystem => starSystem.name === jumpLink.destination)
                ?.coordinates
            };
          })
          .filter((jumpLink): jumpLink is {
            jumpLevel: string,
            coordinates: { x: number, y: number, z: number }
          } => jumpLink.coordinates !== undefined)
          .map(jumpLink => {
            const destination = new THREE.Vector3(
              jumpLink.coordinates.x,
              jumpLink.coordinates.y,
              jumpLink.coordinates.z
            );

            return {jumpLevel: jumpLink.jumpLevel, origin: origin, destination: destination};
          });
      });

    _.uniqWith(jumpLinks, (a, b) => {
      return a.origin.equals(b.destination) && b.origin.equals(a.destination);
    })
      .forEach(jumpLink => {
        let lineMaterial;
        switch (jumpLink.jumpLevel) {
          case "Alpha":
            lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
            break;
          case "Beta":
            lineMaterial = new THREE.LineBasicMaterial({color: 0xffff00})
            break;
          case "Gamma":
            lineMaterial = new THREE.LineBasicMaterial({color: 0x00ff00})
            break;
          case "Delta":
            lineMaterial = new THREE.LineBasicMaterial({color: 0x00ffff})
            break;
          case "Epsilon":
            lineMaterial = new THREE.LineBasicMaterial({color: 0x0000ff})
            break;
        }

        const lineGeometry = new THREE.BufferGeometry()
          .setFromPoints([jumpLink.origin, jumpLink.destination]);

        const line = new THREE.Line(lineGeometry, lineMaterial);
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

  addHoverEffect() {
    if (this.hoverLocation !== null) {
      this.raycaster.setFromCamera(this.hoverLocation, this.camera);
      const hoverIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      if (hoverIntersections.length > 0) {
        const targetObject = hoverIntersections[0].object;
        if (this.hoverCurrent !== null) {
          if (this.hoverCurrent.uuid !== targetObject.uuid) {
            if (this.clickCurrent !== null && this.clickCurrent.uuid === targetObject.uuid) {
              // Don't assign new material or add callout as we're hovering the selected object.
              this.unhoverStarSystem(this.hoverCurrent);
              this.hoverCurrent = targetObject;
            } else if (this.clickCurrent !== null && this.clickCurrent.uuid === this.hoverCurrent.uuid) {
              // Don't restore original material as it's selected.
              this.hoverStarSystem(targetObject);
            } else {
              // Restore original material and then hover new object.
              this.unhoverStarSystem(this.hoverCurrent);
              this.hoverStarSystem(targetObject);
            }
          }
        } else {
          if (this.clickCurrent !== null && this.clickCurrent.uuid === targetObject.uuid) {
            // Don't set a material as we're hovering the selected system.
            this.hoverCurrent = targetObject;
          } else {
            this.hoverStarSystem(targetObject);
          }
        }
      } else {
        if (this.hoverCurrent !== null) {
          if (this.clickCurrent !== null && this.clickCurrent.uuid === this.hoverCurrent.uuid) {
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
