import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShowMapComponent } from './map/showmap/showmap.component';
import { EditmapComponent } from './map/editmap/editmap.component';
import { AboutComponent } from './about/about.component';


const routes: Routes = [
  { path: 'about', component: AboutComponent },
  { path: 'edit', component: EditmapComponent },
  { path: '**', component: ShowMapComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
