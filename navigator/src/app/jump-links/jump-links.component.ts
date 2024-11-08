import {Component, EventEmitter, Input, Output} from '@angular/core';
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
  @Input() starSystem!: StarSystem;
  @Output() starSystemChange = new EventEmitter<StarSystem>();

  starSystems = this.starSystemsService.getStarSystems();

  constructor(private starSystemsService: StarSystemService) {
  }

  updateStarSystem() {
    this.starSystemChange.emit(this.starSystem);
  }
}
