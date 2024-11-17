import {ComponentFixture, TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {JumpLinksComponent} from "./jump-links/jump-links.component";
import {StarMapComponent} from "./star-map/star-map.component";
import {PathfinderComponent} from "./pathfinder/pathfinder.component";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";

jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'),
      setAnimationLoop: jest.fn(),
      setSize: jest.fn()
    })
  };
});

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        JumpLinksComponent,
        NoopAnimationsModule,
        PathfinderComponent,
        StarMapComponent
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title '10 Worlds Navigator'`, () => {
    expect(component.title).toEqual('10 Worlds Navigator');
  });

  it('should update the value of jump levels', function () {
    component.jumpLevelsChange(["One", "Two"]);
    expect(component.jumpLevels).toEqual(["One", "Two"]);
  });

  it('should update the value of path', function () {
    component.pathChange([["Step 1", "Step 2"]]);
    expect(component.path).toEqual([["Step 1", "Step 2"]]);
  });
});
