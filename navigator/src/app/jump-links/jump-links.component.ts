import {Component} from '@angular/core';
import {StarSystemService} from '../star-system.service';
import {MatFormField, MatLabel, MatOption, MatSelect} from '@angular/material/select';
import {StarSystem} from '../star-system';

@Component({
  selector: 'app-jump-links',
  standalone: true,
  imports: [
    MatSelect,
    MatFormField,
    MatLabel,
    MatOption
  ],
  templateUrl: './jump-links.component.html',
  styleUrl: './jump-links.component.css'
})
export class JumpLinksComponent {
  starSystems: StarSystem[];
  selectedStarSystem!: StarSystem;

  constructor(private starSystemsService: StarSystemService) {
    this.starSystems = starSystemsService.getStarSystems()
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
    this.selectedStarSystem = this.starSystems[0];
  }
}
