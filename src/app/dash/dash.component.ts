import { Component, ViewChild, ElementRef } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { AzService } from '../result-services/az.service';
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
  countyOverlay: BehaviorSubject<number>;
  precinctPercentage: boolean;
  displaySettings: BehaviorSubject<boolean>;
  votePercentage: boolean;
  slideshow: BehaviorSubject<boolean>;
  activeCounty: BehaviorSubject<number>;

  constructor(private azService: AzService) {
    this.contests = azService.results;
    this.counties = azService.countiesArray;
    this.fullStateList = azService.fullStateList;
    this.fullCountyList = azService.fullCountyList;
    this.displaySettings = azService.displaySettings;
    this.slideshow = azService.slideshowBS;
    this.activeCounty = azService.activeCounty;
    this.countyOverlay = azService.overlayBS;

    azService.scrollInterval
      .pipe(withLatestFrom(this.slideshow))
      .subscribe(([res, slideshow]) => {
        if (slideshow) {
          try {
            const viewport =
              this.contestContainer.nativeElement.clientWidth + 16;
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

  toggleContest = contest => this.azService.toggleContest(contest);
  showAll = () => this.azService.showAll();
  hideAll = () => this.azService.hideAll();
  hideUncontested = () => this.azService.hideUncontested();
  selectCounty = county => this.azService.selectCounty(county);
  setOverlay = CountyId => this.azService.setOverlay(CountyId);
  toggleSlideshow = () => this.azService.toggleSlideshow();
}
