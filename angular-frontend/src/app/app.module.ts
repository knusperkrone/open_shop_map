import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ShowMapComponent } from "./map/showmap/showmap.component";
import { EditmapComponent } from './map/editmap/editmap.component';
import { NewContentComponent } from './map/editmap/newcontent/newcontent.component';
import { PlacesService } from './service/places.service';
import { LocationService } from './service/location.service';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ShowContentComponent } from './map/showmap/showcontent/showcontent.component';


@NgModule({
  declarations: [
    AppComponent,
    ShowMapComponent,
    EditmapComponent,
    NewContentComponent,
    ShowContentComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatToolbarModule,
  ],
  providers: [PlacesService, LocationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
