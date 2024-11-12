import {TestBed} from '@angular/core/testing';
import {AppComponent} from './app.component';
import {JumpLinksComponent} from "./jump-links/jump-links.component";
import {StarMapComponent} from "./star-map/star-map.component";
import {PathfinderComponent} from "./pathfinder/pathfinder.component";

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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [
        JumpLinksComponent,
        PathfinderComponent,
        StarMapComponent
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title '10 Worlds Navigator'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('10 Worlds Navigator');
  });
});
