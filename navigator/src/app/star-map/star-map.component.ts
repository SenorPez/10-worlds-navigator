import {Component, OnInit} from '@angular/core';
import * as THREE from 'three';
import {StarSystemService} from "../star-system.service";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import * as _ from 'lodash';

@Component({
  selector: 'app-star-map',
  standalone: true,
  imports: [],
  templateUrl: './star-map.component.html',
  styleUrl: './star-map.component.css'
})
export class StarMapComponent implements OnInit {
  scene;
  camera;
  renderer;
  controls;

  raycaster;
  hoverLocation: THREE.Vector2 | null = null;
  clickLocation: THREE.Vector2 | null = null;
  mouseDownLocation: THREE.Vector2 | null = null

  hoverMaterial = new THREE.MeshBasicMaterial({color: 0xffaaaa})
  clickMaterial = new THREE.MeshBasicMaterial({color: 0xff0000})

  hoverObject: THREE.Object3D | null = null;
  clickObject: THREE.Object3D | null = null;

  hoverReplacedMaterial: THREE.MeshBasicMaterial | null = null;
  clickReplacedMaterial: THREE.MeshBasicMaterial | null = null;

  animate = () => {
    this.controls.update();
    this.findIntersections();
    this.renderer.render(this.scene, this.camera);
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
    this.controls = this.createControls(this.camera);
    this.raycaster = this.createRaycaster();
  }

  ngOnInit() {
    this.initCamera(this.camera);
    this.initRenderer(this.renderer);
    this.initControls(this.controls, this.renderer);

    this.addStars(this.scene);
    this.addJumpLinks(this.scene);

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
        scene.add(starMesh);
      });
  }

  addJumpLinks(scene: THREE.Scene) {
    this.starSystemsService.getStarSystems()
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
      })
      .forEach(jumpLink => {
        let lineMaterial;
        switch (jumpLink.jumpLevel) {
          case "Alpha":
            lineMaterial = new THREE.LineBasicMaterial({color: 'red'});
            break;
          case "Beta":
            lineMaterial = new THREE.LineBasicMaterial({color: 'orange'})
            break;
          case "Gamma":
            lineMaterial = new THREE.LineBasicMaterial({color: 'yellow'})
            break;
          case "Delta":
            lineMaterial = new THREE.LineBasicMaterial({color: 'green'})
            break;
          case "Epsilon":
            lineMaterial = new THREE.LineBasicMaterial({color: 'blue'})
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

  createControls(camera: THREE.Camera) {
    return new TrackballControls(camera);
  }

  initControls(controls: TrackballControls, renderer: THREE.WebGLRenderer) {
    controls.domElement = renderer.domElement;
    controls.connect();
    controls.handleResize();
  }

  createRaycaster() {
    return new THREE.Raycaster();
  }

  findIntersections() {
    if (this.hoverLocation !== null) {
      this.raycaster.setFromCamera(this.hoverLocation, this.camera);
      const hoverIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      // We have a target object.
      if (hoverIntersections.length > 0) {
        // We have a currently hovered object.
        if (this.hoverObject !== null && this.hoverReplacedMaterial !== null) {
          // If the currently hovered object doesn't match, restore material, hover new object,
          // and memoize replaced material.
          if (this.hoverObject.uuid !== hoverIntersections[0].object.uuid) {
            // Only restore material if it's not selected.
            if (this.clickObject?.uuid !== hoverIntersections[0].object.uuid) {
              ((this.hoverObject as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.hoverReplacedMaterial;
            }

            this.hoverObject = hoverIntersections[0].object;
            this.hoverReplacedMaterial = (hoverIntersections[0].object as THREE.Mesh).material as THREE.MeshBasicMaterial;
            ((this.hoverObject as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.hoverMaterial;
          }
        // We don't have a currently hovered object.
        } else {
          this.hoverObject = hoverIntersections[0].object;

          // Only change the material if it's not selected.
          if (this.clickObject?.uuid !== hoverIntersections[0].object.uuid) {
            this.hoverReplacedMaterial = (this.hoverObject as THREE.Mesh).material as THREE.MeshBasicMaterial;
            ((this.hoverObject as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.hoverMaterial;
          } else {
            this.hoverReplacedMaterial = this.clickReplacedMaterial;
          }
        }
      // We don't have a target object.
      } else {
        // We have a currently hovered object.
        if (this.hoverObject !== null && this.hoverReplacedMaterial !== null) {
          // Only restore the material if it's not selected.
          if (this.clickObject?.uuid !== this.hoverObject.uuid) {
            (this.hoverObject as THREE.Mesh).material = this.hoverReplacedMaterial;
          }

          this.hoverObject = null;
          this.hoverReplacedMaterial = null;
        }
      }
    }

    if (this.mouseDownLocation !== null && this.clickLocation !== null) {
      this.raycaster.setFromCamera(this.mouseDownLocation, this.camera);
      const mouseDownIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      this.raycaster.setFromCamera(this.clickLocation, this.camera);
      const clickIntersections = this.raycaster.intersectObjects(this.scene.children, false)
        .filter(intersection => intersection.object.type === "Mesh");

      // Reset locations to prevent recursion.
      this.mouseDownLocation = null;
      this.clickLocation = null;

      // We have a target object.
      if (
        mouseDownIntersections.length > 0 &&
        clickIntersections.length > 0 &&
        _.isEqual(mouseDownIntersections[0].object, clickIntersections[0].object)
      ) {
        // We have a currently selected object.
        if (this.clickObject !== null && this.clickReplacedMaterial !== null) {
          // If the currently selected object matches the target object, unselect and set the hover material (since the mouse has to be over it).
          // Otherwise, restore material to the currently selected object and select new object.
          if (this.clickObject.uuid === clickIntersections[0].object.uuid) {
            ((this.clickObject as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.hoverMaterial;
            this.clickObject = null;
            this.clickReplacedMaterial = null;
          } else {
            ((this.clickObject as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.clickReplacedMaterial;
            this.clickObject = clickIntersections[0].object;
            this.clickReplacedMaterial = this.hoverReplacedMaterial;
            ((clickIntersections[0].object as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.clickMaterial;
          }
        } else {
          this.clickObject = clickIntersections[0].object;
          this.clickReplacedMaterial = this.hoverReplacedMaterial;
          ((clickIntersections[0].object as THREE.Mesh).material as THREE.MeshBasicMaterial) = this.clickMaterial;
        }
      }
    }
  }
}
