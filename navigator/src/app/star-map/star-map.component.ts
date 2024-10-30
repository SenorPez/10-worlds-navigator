import {Component} from '@angular/core';
import * as THREE from 'three';
import {MeshBasicMaterial} from 'three';
import {StarSystemService} from "../star-system.service";
import {StarSystem} from "../star-system";

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

  animate = () => this.renderer.render(this.scene, this.camera);

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

    stars.forEach(star => {
      const starGeometry = new THREE.SphereGeometry(0.1);
      const starMaterial = star.name === "Sol" ?
        new MeshBasicMaterial({color: 0xffff00}) :
        new MeshBasicMaterial({color: 0xffffff});
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(star.coordinates.x, star.coordinates.y, star.coordinates.z);
      this.scene.add(starMesh);
    });

    this.renderer.setAnimationLoop(this.animate);
  }
}
