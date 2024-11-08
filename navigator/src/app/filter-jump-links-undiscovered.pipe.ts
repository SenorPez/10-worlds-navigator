import { Pipe, PipeTransform } from '@angular/core';
import {JumpLink} from "./jump-link";

@Pipe({
  name: 'filterJumpLinksUndiscovered',
  standalone: true
})
export class FilterJumpLinksUndiscoveredPipe implements PipeTransform {
  transform(array: JumpLink[]): JumpLink[] {
    return array.filter(jumpLink => jumpLink.discovered !== null);
  }
}
