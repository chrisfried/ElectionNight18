import { Component } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { AzService } from '../result-services/az.service';
import { BrowserStateService } from '../browser-state.service';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss']
})
export class DashComponent {
  /** Based on the screen size, switch from standard to one column per row */
  contests: Observable<any>;
  counties: BehaviorSubject<{}[]>;
  countyOverlay = 0;
  precinctPercentage: boolean;
  showHidden: BehaviorSubject<boolean>;
  votePercentage: boolean;

  constructor(
    private azService: AzService,
    browserStateService: BrowserStateService
  ) {
    this.contests = azService.results;
    this.counties = azService.countiesBS;
    this.showHidden = azService.showHidden;
  }

  toggleContest = (contest: number) => this.azService.toggleContest(contest);

  showAll = () => this.azService.showAll();
  hideAll = () => this.azService.hideAll();
  hideUncontested = () => this.azService.hideUncontested();
}
