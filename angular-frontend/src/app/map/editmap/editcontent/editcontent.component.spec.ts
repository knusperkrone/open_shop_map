import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditContentComponent } from './editcontent.component';

describe('EditcontentComponent', () => {
  let component: EditContentComponent;
  let fixture: ComponentFixture<EditContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
