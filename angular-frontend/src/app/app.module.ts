import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AboutComponent } from './about/about.component';
import { MapComponent } from "./map/map.component";
import { ClickContentComponent } from './map/clickcontent/clickcontent.component';
import { ShowContentComponent } from './map/showcontent/showcontent.component';
import { EditContentComponent } from './map/editcontent/editcontent.component';
import { IntroTextComponent } from './map/intro/intro-text/intro-text.component';
import { PlacesService } from './service/places.service';
import { ShopService } from './service/shop.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { IntroTutorialComponent } from './map/intro/intro-tutorial/intro-tutorial.component';



@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ShowContentComponent,
    EditContentComponent,
    ClickContentComponent,
    AboutComponent,
    IntroTextComponent,
    IntroTutorialComponent,
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
    MatTabsModule,
    MatToolbarModule,
  ],
  providers: [PlacesService, ShopService],
  bootstrap: [AppComponent]
})
export class AppModule { }
