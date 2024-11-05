import {Component} from '@angular/core';
import {StarSystemService} from '../star-system.service';
import {MatFormField, MatLabel, MatOption, MatSelect} from '@angular/material/select';
import {StarSystem} from '../star-system';
import {MatList, MatListItem} from "@angular/material/list";
import {SortByPipe} from "../sort-by.pipe";
import {FilterJumpLinksUndiscoveredPipe} from "../filter-jump-links-undiscovered.pipe";

@Component({
  selector: 'app-jump-links',
  standalone: true,
  imports: [
    FilterJumpLinksUndiscoveredPipe,
    MatSelect,
    MatFormField,
    MatLabel,
    MatOption,
    MatList,
    MatListItem,
    SortByPipe
  ],
  templateUrl: './jump-links.component.html',
  styleUrl: './jump-links.component.css'
})
export class JumpLinksComponent {
  starSystems: StarSystem[];
  selectedStarSystem!: StarSystem;

  constructor(private starSystemsService: StarSystemService) {
    this.starSystems = starSystemsService.getStarSystems();
    this.selectedStarSystem = this.starSystems[0];
  }
}
