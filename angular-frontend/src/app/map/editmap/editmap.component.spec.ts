import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditmapComponent } from './editmap.component';

describe('EditmapComponent', () => {
  let component: EditmapComponent;
  let fixture: ComponentFixture<EditmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
