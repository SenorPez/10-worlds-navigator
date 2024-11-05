import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as THREE from 'three';
import {StarSystemService} from "../star-system.service";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import * as _ from 'lodash';
import {CSS2DObject, CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";

@Component({
  selector: 'app-star-map',
  standalone: true,
  imports: [],
  templateUrl: './star-map.component.html',
  styleUrl: './star-map.component.css',
  encapsulation: ViewEncapsulation.None
})
export class StarMapComponent implements OnInit {
  scene;
  camera;
  renderer;
  labelRenderer;
  controls;

  selectedSystemDiv;
  selectedSystemLabel;

  raycaster;
  hoverLocation: THREE.Vector2 | null = null;
  clickLocation: THREE.Vector2 | null = null;
  mouseDownLocation: THREE.Vector2 | null = null

  hoverMaterial = new THREE.MeshBasicMaterial({color: 0xffaaaa})
  clickMaterial = new THREE.MeshBasicMaterial({color: 0xff0000})

  hoverCurrent: {object: THREE.Object3D, replacedMaterial: THREE.MeshBasicMaterial} | null = null;
  clickCurrent: {object: THREE.Object3D, replacedMaterial: THREE.MeshBasicMaterial} | null = null;

  animate = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

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
  }

  ngOnInit() {
    this.initCamera(this.camera);
    this.initRenderer(this.renderer);
    this.initLabelRenderer(this.labelRenderer);
    this.initControls(this.controls, this.labelRenderer);

    this.addStars(this.scene);
    this.addJumpLinks(this.scene);

    this.selectedSystemLabel.center.set(0, 0);

    this.renderer.setAnimationLoop(this.animate);
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
        starMesh.userData = {starSystemName: starSystem.name}
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

  click(event: MouseEvent) {
    this.clickLocation = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    this.addClickEffect();
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

        if (this.clickCurrent !== null) {
          if (this.clickCurrent.object.uuid === targetObject.uuid) {
            // Unselect object by resetting material (to hover, since the mouse must be over it) and setting to null.
            this.setMaterial((this.clickCurrent.object as THREE.Mesh), this.hoverMaterial);
            this.clickCurrent = null;
            this.selectedSystemLabel.removeFromParent();
          } else {
            // Reset material on current object and select new object.
            this.setMaterial((this.clickCurrent.object as THREE.Mesh), this.clickCurrent.replacedMaterial);
            this.clickCurrent = this.setCurrent(
              targetObject,
              this.hoverCurrent?.replacedMaterial ?? (targetObject as THREE.Mesh).material as THREE.MeshBasicMaterial
            );
            this.selectedSystemDiv.textContent = targetObject.userData['starSystemName'] ?? "SYSTEM NAME NOT SET"
            targetObject.add(this.selectedSystemLabel);
            this.setMaterial((this.clickCurrent.object as THREE.Mesh), this.clickMaterial);
          }
        } else {
          this.clickCurrent = this.setCurrent(
            targetObject,
            this.hoverCurrent?.replacedMaterial ?? (targetObject as THREE.Mesh).material as THREE.MeshBasicMaterial
          );
          this.selectedSystemDiv.textContent = targetObject.userData['starSystemName'] ?? "SYSTEM NAME NOT SET"
          targetObject.add(this.selectedSystemLabel);
          this.setMaterial((this.clickCurrent.object as THREE.Mesh), this.clickMaterial);
        }
      }
    }
  }

  setMaterial(object: THREE.Mesh, material: THREE.MeshBasicMaterial): void {
    object.material = material;
  }

  setCurrent(object: THREE.Object3D, replacedMaterial: THREE.MeshBasicMaterial) {
    return {
      object: object,
      replacedMaterial: replacedMaterial
    };
  }

  mouseDown(event: MouseEvent) {
    this.mouseDownLocation = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
  }

  pointerMove(event: PointerEvent) {
    this.hoverLocation = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    this.addHoverEffect();
  }

  addHoverEffect() {
    if (this.hoverLocation !== null) {
      this.raycaster.setFromCamera(this.hoverLocation, this.camera);
      const hoverIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      if (hoverIntersections.length > 0) {
        const targetObject = hoverIntersections[0].object;
        if (this.hoverCurrent !== null) {
           if (this.hoverCurrent.object.uuid !== targetObject.uuid) {
            if (this.clickCurrent !== null && this.clickCurrent.object.uuid === this.hoverCurrent.object.uuid) {
              // Don't restore previous object, because it's selected.
              this.hoverCurrent = this.setCurrent(targetObject, ((targetObject as THREE.Mesh).material as THREE.MeshBasicMaterial));
              this.setMaterial((this.hoverCurrent.object as THREE.Mesh), this.hoverMaterial);
            } else if (this.clickCurrent !== null && this.clickCurrent.object.uuid === targetObject.uuid) {
              this.setMaterial((this.hoverCurrent.object as THREE.Mesh), this.hoverCurrent.replacedMaterial);
              // Don't modify the material, because it's selected.
              this.hoverCurrent = this.setCurrent(targetObject, this.clickCurrent.replacedMaterial);
            } else {
              // Restore previous object.
              this.setMaterial((this.hoverCurrent.object as THREE.Mesh), this.hoverCurrent.replacedMaterial);
              this.hoverCurrent = this.setCurrent(targetObject, (targetObject as THREE.Mesh).material as THREE.MeshBasicMaterial);
              this.setMaterial((this.hoverCurrent.object as THREE.Mesh), this.hoverMaterial);
            }
          }
        } else {
          if (this.clickCurrent !== null && this.clickCurrent.object.uuid === targetObject.uuid) {
            this.hoverCurrent = this.setCurrent(targetObject, this.clickCurrent.replacedMaterial);
          } else {
            this.hoverCurrent = this.setCurrent(targetObject, (targetObject as THREE.Mesh).material as THREE.MeshBasicMaterial);
            this.setMaterial((this.hoverCurrent.object as THREE.Mesh), this.hoverMaterial);
          }
        }
      } else {
        if (this.hoverCurrent !== null) {
          if (this.clickCurrent !== null && this.clickCurrent.object.uuid === this.hoverCurrent.object.uuid) {
            // Don't restore previous object since it's selected.
            this.hoverCurrent = null;
          } else {
            // Restore previous object.
            this.setMaterial((this.hoverCurrent.object as THREE.Mesh), this.hoverCurrent.replacedMaterial)
            this.hoverCurrent = null;
          }
        }
      }
    }
  }

  windowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const aspectRatio = window.innerWidth / window.innerHeight;
    const coordinateLimit = this.coordinateLimit * 1.05;

    this.camera.left = aspectRatio > 1 ? -coordinateLimit * aspectRatio : -coordinateLimit;
    this.camera.right = aspectRatio > 1 ? coordinateLimit * aspectRatio : coordinateLimit;
    this.camera.top = aspectRatio > 1 ? coordinateLimit : coordinateLimit / aspectRatio;
    this.camera.bottom = aspectRatio > 1 ? -coordinateLimit : -coordinateLimit / aspectRatio;

    this.camera.updateProjectionMatrix();
    this.controls.handleResize();
  }

  createScene() {
    return new THREE.Scene();
  }

  createCamera() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const coordinateLimit = this.coordinateLimit * 1.05;

    const leftLimit = aspectRatio > 1 ? -coordinateLimit * aspectRatio : -coordinateLimit;
    const rightLimit = aspectRatio > 1 ? coordinateLimit * aspectRatio : coordinateLimit;
    const topLimit = aspectRatio > 1 ? coordinateLimit : coordinateLimit / aspectRatio;
    const bottomLimit = aspectRatio > 1 ? -coordinateLimit : -coordinateLimit / aspectRatio;

    return new THREE.OrthographicCamera(leftLimit, rightLimit, topLimit, bottomLimit, 0.1, 100);
  }

  initCamera(camera: THREE.Camera) {
    camera.position.z = this.coordinateLimit * 2;
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
  }

  initRenderer(renderer: THREE.WebGLRenderer) {
    const container = document.getElementById("divCanvas") ?? document.body;
    container.appendChild(renderer.domElement);
  }

  createLabelRenderer() {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    return labelRenderer;
  }

  initLabelRenderer(labelRenderer: CSS2DRenderer) {
    const container = document.getElementById("divCanvas") ?? document.body;
    labelRenderer.domElement.id = "selectedSystem";
    container.appendChild(labelRenderer.domElement);
  }

  createControls(camera: THREE.Camera) {
    return new TrackballControls(camera);
  }

  initControls(controls: TrackballControls, renderer: CSS2DRenderer) {
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.handleResize();
  }

  createRaycaster() {
    return new THREE.Raycaster();
  }
}
