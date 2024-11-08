import {ComponentFixture, TestBed} from '@angular/core/testing';

import {JumpLinksComponent} from './jump-links.component';
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {HarnessLoader, parallel} from "@angular/cdk/testing";
import {MatSelectModule} from "@angular/material/select";
import {MatFormFieldModule} from "@angular/material/form-field";
import {ReactiveFormsModule} from "@angular/forms";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {MatFormFieldHarness} from "@angular/material/form-field/testing";
import {MatSelectHarness} from "@angular/material/select/testing";
import {MatOptionHarness} from "@angular/material/core/testing";
import {MatListHarness, MatListItemHarness} from "@angular/material/list/testing";
import {StarSystemService} from "../star-system.service";
import {StarSystem} from "../star-system";

describe('JumpLinksComponent', () => {
  let fixture: ComponentFixture<JumpLinksComponent>;
  let component: JumpLinksComponent;
  let loader: HarnessLoader;

  let starSystemService: { getStarSystems: jest.Mock; };
  let starSystemServiceReturnValue: StarSystem[] = [
    {name: 'Alpha Hydri', transitTimes: [3, 2, 1], coordinates: {x: 1, y: 2, z: 2}, jumpLinks: [{destination: 'Beta Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}, {destination: 'Omega Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}]},
    {name: 'Beta Hydri', transitTimes: [3, 2, 1], coordinates: {x: 2, y: 1, z: 2}, jumpLinks: [{destination: 'Alpha Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}, {destination: 'Omega Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}]},
    {name: 'Omega Hydri', transitTimes: [3, 2, 1], coordinates: {x: 2, y: 2, z: 1}, jumpLinks: [{destination: 'Beta Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}, {destination: 'Beta Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}]},
  ]

  beforeEach(async () => {
    starSystemService = {
      getStarSystems: jest.fn(),
    };
    starSystemService.getStarSystems.mockReturnValue(starSystemServiceReturnValue);

    await TestBed.configureTestingModule({
      imports: [
        JumpLinksComponent,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
        ReactiveFormsModule
      ]
    }).overrideProvider(StarSystemService, {useValue: starSystemService})
      .compileComponents();
    fixture = TestBed.createComponent(JumpLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Star system select', () => {
    let formFieldHarness: MatFormFieldHarness;
    let selectHarness: MatSelectHarness;

    beforeEach(async () => {
      formFieldHarness = await loader.getHarness(MatFormFieldHarness.with({selector: '#formField_starSystem'}));
      selectHarness = await loader.getHarness(MatSelectHarness.with({selector: '#select_starSystem'}));
    });

    it('should load the select harness', () => {
      expect(selectHarness).toBeTruthy();
    });

    it('should open and close the select', async () => {
      expect(await selectHarness.isOpen()).toBeFalsy();

      await selectHarness.open();
      expect(await selectHarness.isOpen()).toBeTruthy();

      await selectHarness.close();
      expect(await selectHarness.isOpen()).toBeFalsy();
    });

    it('should have options from the service in sorted order', async () => {
      await selectHarness.open();
      const options: MatOptionHarness[] = await selectHarness.getOptions();

      expect(options.length).toBe(3);
      expect(await options[0].getText()).toBe('Alpha Hydri');
      expect(await options[1].getText()).toBe('Beta Hydri');
      expect(await options[2].getText()).toBe('Omega Hydri');
    });

    it('should update with a selected value', async () => {
      const expectedValue: string = 'Omega Hydri';

      await selectHarness.open();
      const selectOption = await selectHarness.getOptions({text: expectedValue})
      expect(selectOption.length).toBe(1);
      expect(await selectOption[0].getText()).toBe(expectedValue.toString());
      await selectOption[0].click();

      expect(await selectHarness.getValueText()).toBe(expectedValue);
      expect(component.starSystem.name).toBe(expectedValue);
    });
  });

  describe('Jump links list', () => {
    let listHarness: MatListHarness;

    beforeEach(async () => {
      listHarness = await loader.getHarness(MatListHarness.with({selector: '#list_jumpLinks'}));
      component.starSystem = {
        name: 'Alpha Hydri',
        transitTimes: [3, 2, 1],
        coordinates: {x: 1, y: 2, z: 2},
        jumpLinks: [
          {destination: 'Omega Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1},
          {destination: 'Beta Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}
        ]
      };
    });

    it('should load the select harness', () => {
      expect(listHarness).toBeTruthy();
    });

    it('should list the outgoing links in alphabetical order', async () => {
      const items: MatListItemHarness[] = await listHarness.getItems();

      expect(items.length).toBe(2);
      expect(items.map(i => i.getFullText()))
      expect(await parallel(() => items.map(i => i.getFullText()))).toEqual([
        'Beta Hydri, Jump Level Gamma',
        'Omega Hydri, Jump Level Gamma'
      ]);

      // expect(await (() => items.map(i => i.getFullText()))).toBe(['Omega Hydri', 'Beta Hydri']);
    });

    it('should update the outgoing links when the selected star system changes', async () => {
      component.starSystem = {
        name: 'Omega Hydri',
        transitTimes: [3, 2, 1],
        coordinates: {x: 2, y: 2, z: 1},
        jumpLinks: [
          {destination: 'Alpha Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1},
          {destination: 'Beta Hydri', jumpLevel: 'Gamma', discovered: 1990, distance: 1}
        ]
      };
      const items: MatListItemHarness[] = await listHarness.getItems();

      expect(items.length).toBe(2);
      expect(await parallel(() => items.map(i => i.getFullText()))).toEqual([
        'Alpha Hydri, Jump Level Gamma',
        'Beta Hydri, Jump Level Gamma'
      ]);
    });
  });
});
