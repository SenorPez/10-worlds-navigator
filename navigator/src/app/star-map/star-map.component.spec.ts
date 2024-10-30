import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarMapComponent } from './star-map.component';

describe('StarMapComponent', () => {
  let component: StarMapComponent;
  let fixture: ComponentFixture<StarMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StarMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
