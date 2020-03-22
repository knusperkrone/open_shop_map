import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowContentComponent } from './showcontent.component';

describe('ShowcontentComponent', () => {
  let component: ShowContentComponent;
  let fixture: ComponentFixture<ShowContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
