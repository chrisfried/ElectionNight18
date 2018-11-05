import { Component, ViewChild, ElementRef } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { MnService } from '../result-services/mn.service';
import { BrowserStateService } from '../browser-state.service';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss']
})
export class DashComponent {
  @ViewChild('contestContainer')
  contestContainer: ElementRef;
  contests: Observable<any>;
  fullStateList: Observable<any>;
  fullCountyList: Observable<any>;
  counties: any[];
  countyOverlay = 0;
  precinctPercentage: boolean;
  displaySettings: BehaviorSubject<boolean>;
  votePercentage: boolean;
  autoscroll: boolean;
  activeCounty: BehaviorSubject<number>;
  contestGroups: string[];
  contestsObj: {};

  constructor(
    private mnService: MnService,
    browserStateService: BrowserStateService
  ) {
    this.contests = mnService.results;
    this.contestGroups = mnService.contestGroups;
    this.contestsObj = mnService.contests;
    this.counties = mnService.counties;
    // this.fullStateList = mnService.fullStateList;
    // this.fullCountyList = mnService.fullCountyList;
    this.displaySettings = mnService.displaySettings;
    // this.autoscroll = mnService.autoscroll;
    // this.activeCounty = mnService.activeCounty;
    mnService.scrollInterval.subscribe(res => {
      if (this.autoscroll) {
        try {
          const viewport = this.contestContainer.nativeElement.clientWidth + 16;
          const strip = this.contestContainer.nativeElement.scrollWidth;
          const position = this.contestContainer.nativeElement.scrollLeft;
          const nextPanelPosition =
            strip - position < viewport
              ? 0
              : (Math.floor(position / viewport) + 1) * viewport;
          this.contestContainer.nativeElement.scrollLeft = nextPanelPosition;
        } catch (e) {}
      }
    });
  }

  // showAll = () => this.mnService.showAll();
  // hideAll = () => this.mnService.hideAll();
  // hideUncontested = () => this.mnService.hideUncontested();
  // selectCounty = county => this.mnService.selectCounty(county);
}
