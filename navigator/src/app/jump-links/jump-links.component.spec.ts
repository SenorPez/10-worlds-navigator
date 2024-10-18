import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JumpLinksComponent } from './jump-links.component';
import {NoopAnimationsModule} from "@angular/platform-browser/animations";

describe('JumpLinksComponent', () => {
  let component: JumpLinksComponent;
  let fixture: ComponentFixture<JumpLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JumpLinksComponent, NoopAnimationsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JumpLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
