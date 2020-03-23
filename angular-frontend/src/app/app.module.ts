import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AboutComponent } from './about/about.component';
import { ShowMapComponent } from "./map/showmap/showmap.component";
import { ShowContentComponent } from './map/showmap/showcontent/showcontent.component';
import { EditmapComponent } from './map/editmap/editmap.component';
import { EditContentComponent } from './map/editmap/editcontent/editcontent.component';
import { PlacesService } from './service/places.service';
import { ShopService } from './service/location.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ClickContentComponent } from './map/clickcontent/clickcontent.component';


@NgModule({
  declarations: [
    AppComponent,
    ShowMapComponent,
    ShowContentComponent,
    EditmapComponent,
    EditContentComponent,
    ClickContentComponent,
    AboutComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatToolbarModule,
  ],
  providers: [PlacesService, ShopService],
  bootstrap: [AppComponent]
})
export class AppModule { }
