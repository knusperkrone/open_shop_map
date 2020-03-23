import { Component, ViewChild, ElementRef, AfterViewInit, ComponentFactoryResolver, ViewContainerRef, Renderer2 } from '@angular/core';
import { ShopService } from '../../service/location.service';
import { Shop } from '../../models/dto';
import { BaseMapComponent } from '../basemap.compontent';
import { ShowContentComponent } from './showcontent/showcontent.component';
import { Router } from '@angular/router';
import { ClickContentComponent } from '../clickcontent/clickcontent.component';


@Component({
  selector: 'app-showmap',
  templateUrl: './showmap.component.html',
  styleUrls: ['./showmap.component.scss']
})
export class ShowMapComponent extends BaseMapComponent {

  @ViewChild('infoContainer', { static: false }) infoWindowContent: ElementRef;
  @ViewChild('infoContent', { static: false }) infoContentChild: ShowContentComponent;
  @ViewChild('clickContainer', { read: ViewContainerRef }) clickWindowContent: ViewContainerRef;
  @ViewChild('clickContent', { static: false }) clickContentChild: ClickContentComponent;
  infowindow: google.maps.InfoWindow;

  constructor(locationService: ShopService, router: Router, componentFactoryResolver: ComponentFactoryResolver, renderer: Renderer2) {
    super(locationService, router, componentFactoryResolver, renderer);
  }

  getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: "poi",
        stylers: [
          { visibility: "off" }
        ]
      },
      {
        featureType: "transit",
        stylers: [
          { visibility: "off" }
        ]
      },
    ]
  }

  mapInited() {
    // define window
    this.infowindow = new google.maps.InfoWindow({
      maxWidth: 240,
    });

    this.map.addListener("rightclick", (event) => this.onRightClick(event));
  }

  composeMarker(marker: google.maps.Marker, shop: Shop) {
    const me = this;
    google.maps.event.addDomListener(marker, 'click', () => {
      me.infowindow.setContent(this.infoWindowContent.nativeElement);
      me.infowindow.setPosition(marker.getPosition());
      me.infowindow.open(this.map);
      me.infoContentChild.setShop(shop);
    });
    google.maps.event.addDomListener(marker, 'rightclick', () => {
      me.showOverlay(
        "Shop editieren",
        () => me.navigate('edit', shop),
        marker.getPosition(),
        me.clickWindowContent,
      );
    });
  }

  private onRightClick(event) {
    let me = this;
    this.showOverlay(
      "Bearbeitungsmodus",
      () => me.navigate('edit'),
      event,
      this.clickWindowContent,
    );
  }

}
