import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroTutorialComponent } from './intro-tutorial.component';

describe('IntroTutorialComponent', () => {
  let component: IntroTutorialComponent;
  let fixture: ComponentFixture<IntroTutorialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IntroTutorialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntroTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
