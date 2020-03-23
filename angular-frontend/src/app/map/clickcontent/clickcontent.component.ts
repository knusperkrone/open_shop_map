import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-clickcontent',
  templateUrl: './clickcontent.component.html',
  styleUrls: ['./clickcontent.component.scss']
})
export class ClickContentComponent implements OnInit {

  msg: string;
  callback: VoidFunction;

  constructor() { }

  ngOnInit(): void {
  }

}
