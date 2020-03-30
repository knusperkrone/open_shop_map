import { Component, OnInit, Inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { async } from '@angular/core/testing';

@Component({
  selector: 'app-new-shop-dialog',
  templateUrl: './new-shop-dialog.component.html',
  styleUrls: ['./new-shop-dialog.component.scss']
})
export class NewShopDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('input') inputRef: ElementRef;

  inputControl: FormControl;

  constructor(public dialogRef: MatDialogRef<NewShopDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.inputControl = new FormControl(this.data.title);
  }

  ngAfterViewInit() {
    var autocomplete = new google.maps.places.Autocomplete(this.inputRef.nativeElement);
    autocomplete.setOptions({ strictBounds: true, types: ['establishment'] });
    autocomplete.setFields(['geometry', 'name']);
    autocomplete.bindTo('bounds', this.data.map);

    autocomplete.addListener('click', () => {
      console.log('click');
    });
    autocomplete.addListener('place_select', () => {
      console.log('place_select');
    });
    autocomplete.addListener('place_select', () => {
      console.log('place_select');
    });
    autocomplete.addListener('place_changed', ()  =>  {
      autocomplete.unbindAll();
      let shop = autocomplete.getPlace();

        this.dialogRef.close(shop);

    });
  }
}
