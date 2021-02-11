import { Injectable } from '@angular/core';
import {
  of,
  forkJoin,
  interval,
  BehaviorSubject,
  merge,
  combineLatest,
  Observable,
} from 'rxjs';
import { map, switchMap, catchError, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';
import { Races, Result, ResultsResponse } from '../types';

@Injectable({
  providedIn: 'root',
})
export class MnService {
  storedHidden = localStorage.getItem('mnen-hidden');
  hidden = this.storedHidden ? JSON.parse(this.storedHidden) : {};
  hiddenBS = new BehaviorSubject(this.hidden);
  saveHidden = this.hiddenBS.subscribe((res) =>
    localStorage.setItem('mnen-hidden', JSON.stringify(res))
  );

  storedSlideshow = localStorage.getItem('mnen-slideshow');
  slideshowBS = new BehaviorSubject(
    this.storedSlideshow ? JSON.parse(this.storedSlideshow) : false
  );
  saveSlideshow = this.slideshowBS.subscribe((res) =>
    localStorage.setItem('mnen-slideshow', JSON.stringify(res))
  );

  displaySettings: BehaviorSubject<boolean> = new BehaviorSubject(false);
  scrollInterval = interval(20000);

  results: BehaviorSubject<
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
  > = new BehaviorSubject({});

  constructor(private http: HttpClient, private firestore: AngularFirestore) {
    const resultsSnapshot = this.firestore
      .collection('results')
      .snapshotChanges();
    resultsSnapshot
      .pipe(
        map((data) => {
          const results = {};
          data.forEach((e) => {
            const race = e.payload.doc.id as Races;
            let raceId: 'A' | 'B' | 'C' | 'D' | 'E';
            switch (race) {
              case 'USPres':
                raceId = 'A';
                break;
              case 'ussenate':
                raceId = 'B';
                break;
              case 'ushouse':
                raceId = 'C';
                break;
              case 'stsenate':
                raceId = 'D';
                break;
              case 'LegislativeByDistrict':
                raceId = 'E';
                break;
            }
            const list = (results[raceId] = {});
            const response = e.payload.doc.data() as ResultsResponse;
            response.data.forEach((result) => {
              if (!list[result.officeId]) {
                list[result.officeId] = {
                  countyId: result.countyId,
                  district: result.district,
                  officeId: result.officeId,
                  officeName: result.officeName,
                  precinctName: result.precinctName,
                  precinctsReporting: parseInt(result.precinctsReporting),
                  state: result.state,
                  totalPrecincts: parseInt(result.totalPrecincts),
                  totalVotes: parseInt(result.totalVotes),
                  choices: {},
                  choicesSorted: [],
                };
              }
              if (!list[result.officeId].choices[result.candidateOrderCode]) {
                list[result.officeId].choices[result.candidateOrderCode] = {
                  candidateName: result.candidateName,
                  candidateOrderCode: result.candidateOrderCode,
                  partyAbbreviation: result.partyAbbreviation,
                  votes: parseInt(result.votes),
                  votesPercentage: parseFloat(result.votesPercentage),
                };
                list[result.officeId].choicesSorted.push(
                  list[result.officeId].choices[result.candidateOrderCode]
                );
                list[result.officeId].choicesSorted.sort(
                  (a: any, b: any) => b.votes - a.votes
                );
              }
            });
          });
          console.log(results);
          this.results.next(results);
        })
      )
      .subscribe();
  }

  toggleSettings() {
    this.displaySettings
      .pipe(take(1))
      .subscribe((displaySettings) =>
        this.displaySettings.next(!displaySettings)
      );
  }

  toggleSlideshow() {
    this.slideshowBS.pipe(take(1)).subscribe((res) => {
      this.slideshowBS.next(!res);
    });
  }

  toggleContest(set: string, contest: string) {
    const uid = `${set}${contest}`;
    this.hidden[uid] = !this.hidden[uid];
    this.hiddenBS.next(this.hidden);
  }

  toggleContestHide(set: string, contest: string) {
    const uid = `${set}${contest}`;
    this.hidden[uid] = true;
    this.hiddenBS.next(this.hidden);
  }

  toggleContestShow(set: string, contest: string) {
    const uid = `${set}${contest}`;
    this.hidden[uid] = false;
    this.hiddenBS.next(this.hidden);
  }
}
