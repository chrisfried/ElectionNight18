import { Component, ViewChild, ElementRef } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { MnService } from '../result-services/mn.service';
import { BrowserStateService } from '../browser-state.service';
import { Races } from '../types';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss'],
})
export class DashComponent {
  @ViewChild('contestContainer')
  contestContainer: ElementRef;
  contestSets: Observable<
    {
      [key in Races]?: {
        countyId: string;
        district: string;
        officeId: string;
        officeName: string;
        precinctName: string;
        precinctsReporting: number;
        state: string;
        totalPrecincts: number;
        totalVotes: number;
        choices: {
          [candidateOrderCode: string]: {
            candidateName: string;
            candidateOrderCode: string;
            partyAbbreviation: string;
            votes: number;
            votesPercentage: number;
          };
        };
      };
    }
  >;
  unfilteredContests: Observable<any>;
  fullStateList: Observable<any>;
  fullCountyList: Observable<any>;
  counties: any[];
  countyOverlay = 0;
  precinctPercentage: boolean;
  displaySettings: BehaviorSubject<boolean>;
  votePercentage: boolean;
  slideshow: BehaviorSubject<boolean>;
  activeCounty: BehaviorSubject<number>;
  contestGroups: string[];
  contestsObj: Observable<{}>;
  hidden: { [key: string]: boolean };

  isMobile: boolean;

  constructor(
    private mnService: MnService,
    browserStateService: BrowserStateService
  ) {
    window.onresize = () => (this.isMobile = window.innerWidth < 800);

    this.contestSets = mnService.results;
    this.hidden = mnService.hidden;
    this.displaySettings = mnService.displaySettings;
    this.slideshow = mnService.slideshowBS;

    mnService.scrollInterval
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

  toggleContest = (set: string, contest: string) =>
    this.mnService.toggleContest(set, contest);
  toggleSet = (set: { key: string; value: {} }, show: boolean) => {
    for (const contestKey in set.value) {
      if (contestKey) {
        if (show) {
          this.mnService.toggleContestShow(set.key, contestKey);
        } else {
          this.mnService.toggleContestHide(set.key, contestKey);
        }
      }
    }
  };
  toggleSlideshow = () => this.mnService.toggleSlideshow();
}
