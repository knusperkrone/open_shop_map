import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClickContentComponent } from './clickcontent.component';

describe('ClickcontentComponent', () => {
  let component: ClickContentComponent;
  let fixture: ComponentFixture<ClickContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClickContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClickContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
