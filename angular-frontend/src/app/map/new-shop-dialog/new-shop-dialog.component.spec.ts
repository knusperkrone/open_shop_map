import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewShopDialogComponent } from './new-shop-dialog.component';

describe('NewShopDialogComponent', () => {
  let component: NewShopDialogComponent;
  let fixture: ComponentFixture<NewShopDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewShopDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewShopDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
