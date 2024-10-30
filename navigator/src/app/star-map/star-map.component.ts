import {Component} from '@angular/core';
import * as THREE from 'three';
import {Camera, MeshBasicMaterial} from 'three';
import {StarSystemService} from "../star-system.service";
import {StarSystem} from "../star-system";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";

@Component({
  selector: 'app-star-map',
  standalone: true,
  imports: [],
  templateUrl: './star-map.component.html',
  styleUrl: './star-map.component.css'
})
export class StarMapComponent {
  scene = new THREE.Scene();
  camera;
  renderer = new THREE.WebGLRenderer();

  controls: TrackballControls;

  animate = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  createControls(camera: Camera) {
    return new TrackballControls(camera, this.renderer.domElement);
  }

  getLimit = (starSystems: StarSystem[]) => {
    return Math.max(
      Math.max(...starSystems.map(star => Math.abs(star.coordinates.x))),
      Math.max(...starSystems.map(star => Math.abs(star.coordinates.y))),
      Math.max(...starSystems.map(star => Math.abs(star.coordinates.z)))
    )
  }

  constructor(private starSystemsService: StarSystemService) {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const coordinateLimit = this.getLimit(starSystemsService.getStarSystems()) * 1.05;
    const aspectRatio = window.innerWidth / window.innerHeight;

    const leftLimit = aspectRatio > 1 ? -coordinateLimit * aspectRatio : -coordinateLimit;
    const rightLimit = aspectRatio > 1 ? coordinateLimit * aspectRatio : coordinateLimit;
    const topLimit = aspectRatio > 1 ? coordinateLimit : coordinateLimit / aspectRatio;
    const bottomLimit = aspectRatio > 1 ? -coordinateLimit : -coordinateLimit / aspectRatio;

    this.camera = new THREE.OrthographicCamera(
      leftLimit, rightLimit,
      topLimit, bottomLimit,
      0.1, coordinateLimit * 2
    );
    this.camera.position.z = coordinateLimit;

    const stars = starSystemsService.getStarSystems()
      .map(starSystem => ({name: starSystem.name, coordinates: starSystem.coordinates}));

    let jumpLinks = starSystemsService.getStarSystems()
      .flatMap(starSystem => {
        const origin = starSystem.coordinates;
        return starSystem.jumpLinks
          .filter(jumpLink => jumpLink.discovered !== null)
          .map(jumpLink => {
          let destination = stars.find(star => star.name === jumpLink.destination)!.coordinates;
          return {origin: origin, destination: destination, jumpLevel: jumpLink.jumpLevel}
        });
      })
      .filter((val)  => val.destination !== undefined);

    stars.forEach(star => {
      const starGeometry = new THREE.SphereGeometry(0.1);
      const starMaterial = star.name === "Sol" ?
        new MeshBasicMaterial({color: 0xffff00}) :
        new MeshBasicMaterial({color: 0xffffff});
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(star.coordinates.x, star.coordinates.y, star.coordinates.z);
      this.scene.add(starMesh);
    });

    jumpLinks.forEach(jumpLink => {
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
        .setFromPoints([
          new THREE.Vector3(jumpLink.origin.x, jumpLink.origin.y, jumpLink.origin.z),
          new THREE.Vector3(jumpLink.destination.x, jumpLink.destination.y, jumpLink.destination.z)
        ]);

      const link = new THREE.Line(lineGeometry, lineMaterial);
      this.scene.add(link);
    });

    this.controls = thiAs.createControls(this.camera);
    this.renderer.setAnimationLoop(this.animate);
  }
}
