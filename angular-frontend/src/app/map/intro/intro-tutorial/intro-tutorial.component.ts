import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-intro-tutorial',
  templateUrl: './intro-tutorial.component.html',
  styleUrls: ['./intro-tutorial.component.scss']
})
export class IntroTutorialComponent implements OnInit {

  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() prev: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void { }

  emitClose() {
    this.close.emit(true);
  }

  emitPrev() {
    this.prev.emit(true);
  }
}
