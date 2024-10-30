import {Component, OnInit} from '@angular/core';
import * as THREE from 'three';
import {Camera, MeshBasicMaterial, WebGLRenderer} from 'three';
import {StarSystemService} from "../star-system.service";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";

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

  animate = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  constructor(private starSystemsService: StarSystemService) {
    this.scene = this.createScene();
    this.camera = this.createCamera(this.getCoordinateLimit());
    this.renderer = this.createRenderer();
    this.controls = this.createControls(this.camera, this.renderer);
  }

  ngOnInit() {
    this.camera.position.z = this.getCoordinateLimit() * 2;

    this.addStars(this.scene);
    this.addJumpLinks(this.scene);

    this.renderer.setAnimationLoop(this.animate);
  }

  addStars(scene: THREE.Scene) {
    const starGeometry = new THREE.SphereGeometry(0.1);
    this.starSystemsService.getStarSystems()
      .forEach(starSystem => {
        const starMaterial = starSystem.name === "Sol" ?
          new MeshBasicMaterial({color: 0xffff00}) :
          new MeshBasicMaterial({color: 0xffffff});
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
          .filter((jumpLink): jumpLink is { jumpLevel: string, coordinates: {x: number, y: number, z: number} } => jumpLink.coordinates !== undefined)
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

  getCoordinateLimit() {
    return Math.max(...this.starSystemsService.getStarSystems()
      .flatMap(starSystem => {
        return [starSystem.coordinates.x, starSystem.coordinates.y, starSystem.coordinates.z];
      }));
  }

  createScene() {
    return new THREE.Scene();
  }

  createCamera(coordinateLimit: number) {
    const aspectRatio = window.innerWidth / window.innerHeight;

    const leftLimit = aspectRatio > 1 ? -coordinateLimit * aspectRatio : -coordinateLimit;
    const rightLimit = aspectRatio > 1 ? coordinateLimit * aspectRatio : coordinateLimit;
    const topLimit = aspectRatio > 1 ? coordinateLimit : coordinateLimit / aspectRatio;
    const bottomLimit = aspectRatio > 1 ? -coordinateLimit : -coordinateLimit / aspectRatio;

    return new THREE.OrthographicCamera(leftLimit, rightLimit, topLimit, bottomLimit, 0.1, 100);
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById("divCanvas") ?? document.body;
    container.appendChild(renderer.domElement);
    return renderer;
  }

  createControls(camera: Camera, renderer: WebGLRenderer) {
    return new TrackballControls(camera, renderer.domElement);
  }
}
