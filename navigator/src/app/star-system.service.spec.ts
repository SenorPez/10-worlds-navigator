import { TestBed } from '@angular/core/testing';

import { StarSystemService } from './star-system.service';

describe('StarSystemService', () => {
  let service: StarSystemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StarSystemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return star systems', () => {
    expect(service.getStarSystems().length).toBe(120);
  });

  it('should have the correct data integrity', () => {
    // Checks:
    // - There are no self-links.
    // - There should only be one reciprocal system.
    // - There should only be one reciprocal link.
    // - The reciprocal link should be identical.

    const data = service.getStarSystems();
    data.forEach(starSystem => {
      const selfLink = starSystem.jumpLinks
        .filter(jumpLink => jumpLink.destination === starSystem.name);
      if (selfLink.length > 0) console.log(`Self link found for ${starSystem.name}`);
      expect(selfLink.length).toBe(0);

      const forwardSystem = starSystem;
      starSystem.jumpLinks.forEach(jumpLink => {
        const forwardLink = jumpLink;

        // There should only be one reciprocal system.
        let targetSystem = data.filter(starSystem => starSystem.name === forwardLink.destination);
        if (targetSystem.length > 1) console.log(`Multiple target systems found for ${forwardSystem.name}.`);
        if (targetSystem.length < 1) console.log(`No target system found for ${forwardSystem.name}.`);
        expect(targetSystem.length).toBe(1);


        // There should only be one reciprocal link.
        let targetLink = targetSystem[0].jumpLinks
          .filter(jumpLink => jumpLink.destination == forwardSystem.name);
        if (targetLink.length > 1) console.log(`Multiple target links for ${forwardSystem.name} found in ${targetSystem[0].name}.`);
        if (targetLink.length < 1) console.log(`No target link for ${forwardSystem.name} found in ${targetSystem[0].name}.`);
        expect(targetLink.length).toBe(1);

        // The jump level for the reciprocal link should be identical.
        const reverseLink = targetLink[0];
        if (forwardLink.jumpLevel !== reverseLink.jumpLevel) console.log(`Link Mismatch: ${forwardSystem.name}->${targetSystem[0].name}`);
        expect(forwardLink.jumpLevel).toEqual(reverseLink.jumpLevel);
      });
    });
  });
});
