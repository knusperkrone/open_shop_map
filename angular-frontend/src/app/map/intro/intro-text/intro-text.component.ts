import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-intro-text',
  templateUrl: './intro-text.component.html',
  styleUrls: ['./intro-text.component.scss']
})
export class IntroTextComponent implements OnInit {

  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() next: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void { }

  emitClose() {
    this.close.emit(true);
  }

  emitNext() {
    this.next.emit(true);
  }
}
