import { Injectable } from '@angular/core';
import * as staticData from '../../assets/mock/az/all_county_races_4_0_en_6689.json';
import * as staticData2 from '../../assets/mock/az/all_county_races_4_0_en_6730.json';
import * as countyData1 from '../../assets/mock/az/all_county_races_4_11_en_6754.json';
import * as stateData3 from '../../assets/mock/az/all_races_4_0_en_6730.json';
import * as countyData3 from '../../assets/mock/az/all_races_4_11_en_6754.json';
import { of, interval, BehaviorSubject, combineLatest, merge } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AzService {
  dataset = false;
  displaySettings: BehaviorSubject<boolean> = new BehaviorSubject(false);
  autoscroll = false;

  counties = {};
  countiesArray = [];

  contests = {};

  dataInitial = of(staticData2);
  data = interval(30000).pipe(
    switchMap(res => {
      this.dataset = !this.dataset;
      if (this.dataset) {
        return of(staticData);
      } else {
        return of(staticData2);
      }
    })
  );

  scrollInterval = interval(20000).pipe(map(res => this.autoscroll));

  stateData = merge(this.dataInitial, this.data);

  // stateData = of(staticData2);
  countyData = of(countyData1);
  stateDataAll = of(stateData3);
  countyDataAll = of(countyData3);

  fullStateList = this.stateData.pipe(
    map(data => this.choiceProcessor(data, 0)),
    tap(data => data.forEach(contest => this.contestNameFix(contest)))
  );
  fullCountyList = this.countyData.pipe(
    map(data => this.choiceProcessor(data, 11)),
    tap(data => data.forEach(contest => this.contestNameFix(contest)))
  );

  unfilteredResults = combineLatest(
    this.fullStateList,
    this.fullCountyList
  ).pipe(
    map(([state, county]) => {
      const contestArray = [...state, ...county];
      contestArray.forEach(contest => {
        contest.ChoicesArray.forEach(choice => {
          const { ChoiceName } = choice;
          if (contest.Choices[ChoiceName]) {
            this.choiceNameFix(contest.Choices[ChoiceName]);
            this.partyFix(contest.Choices[ChoiceName]);
          }
        });
      });
      return contestArray.sort((a, b) => a.ContestId - b.ContestId);
    })
  );

  earlyBallots = combineLatest(this.stateDataAll, this.countyDataAll).pipe(
    map(([state, county]: [any, any]) => {
      return [...state.default, ...county.default];
    })
  );

  results = combineLatest(this.unfilteredResults, this.earlyBallots).pipe(
    map(([contestArray, earlyBallots]) => {
      contestArray.forEach(contest => {
        const earlyContest = earlyBallots.find(
          item => item.ContestId === contest.ContestId
        );
        contest.ChoicesArray.forEach(choice => {
          const earlyChoice = earlyContest.Choices.find(
            item2 => item2.ChoiceName === choice.OriginalChoiceName
          );
          if (earlyChoice) {
            choice.EarlyVotes = earlyChoice.EarlyVotes;
            choice.ProvisionalVotes = earlyChoice.ProvisionalVotes;
            choice.PhotoFile = earlyChoice.PhotoFile;
          }
        });
      });

      return contestArray;
    })
  );

  constructor() {}

  choiceProcessor(data, ResultSetId) {
    if (data.default) {
      data = data.default;
    }

    const contestsArray = [];

    data.forEach(item => {
      const {
        ContestId,
        CountyId,
        CountyName,
        ChoiceTotalVotes,
        PrecinctsParticipating,
        PrecinctsReported,
        ChoiceName,
        ContestName,
        NumberToElect,
        PartyElectionId
      } = item;

      if (!this.counties[CountyId]) {
        this.counties[CountyId] = {
          CountyId,
          CountyName
        };
        this.countiesArray.push(this.counties[CountyId]);
        this.countiesArray.sort((a, b) => a.CountyId - b.CountyId);
      }

      if (!this.contests[ContestId]) {
        this.contests[ContestId] = {
          ContestId,
          ContestName,
          NumberToElect,
          ResultSetId,
          Choices: {},
          ChoicesArray: [],
          ContestTotalVotes() {
            let total = 0;
            this.ChoicesArray.forEach(
              choice => (total += choice.ChoiceTotalVotes())
            );
            return total;
          },
          PrecinctsParticipating() {
            return this.ChoicesArray[0].PrecinctsParticipating();
          },
          PrecinctsReported() {
            return this.ChoicesArray[0].PrecinctsReported();
          }
        };
      }
      if (!this.contests[ContestId].Choices[ChoiceName]) {
        this.contests[ContestId].Choices[ChoiceName] = {
          ChoiceName,
          PartyElectionId,
          byCounty: {},
          byCountyArray: [],
          ChoiceTotalVotes() {
            let total = 0;
            this.byCountyArray.forEach(
              county => (total += county.ChoiceTotalVotes)
            );
            return total;
          },
          PrecinctsParticipating() {
            let total = 0;
            this.byCountyArray.forEach(
              county => (total += county.PrecinctsParticipating)
            );
            return total;
          },
          PrecinctsReported() {
            let total = 0;
            this.byCountyArray.forEach(
              county => (total += county.PrecinctsReported)
            );
            return total;
          }
        };
        this.contests[ContestId].ChoicesArray.push(
          this.contests[ContestId].Choices[ChoiceName]
        );
      }
      if (!this.contests[ContestId].Choices[ChoiceName].byCounty[CountyId]) {
        this.contests[ContestId].Choices[ChoiceName].byCounty[CountyId] = {
          ChoiceTotalVotes,
          PrecinctsParticipating,
          PrecinctsReported
        };
        this.contests[ContestId].Choices[ChoiceName].byCountyArray.push(
          this.contests[ContestId].Choices[ChoiceName].byCounty[CountyId]
        );
      } else {
        this.contests[ContestId].Choices[ChoiceName].byCounty[
          CountyId
        ].ChoiceTotalVotes = ChoiceTotalVotes;
        this.contests[ContestId].Choices[ChoiceName].byCounty[
          CountyId
        ].PrecinctsParticipating = PrecinctsParticipating;
        this.contests[ContestId].Choices[ChoiceName].byCounty[
          CountyId
        ].PrecinctsReported = PrecinctsReported;
      }
      if (!contestsArray.includes(this.contests[ContestId])) {
        contestsArray.push(this.contests[ContestId]);
      }
    });

    contestsArray.forEach(contest => {
      contest.ChoicesArray.sort(
        (a, b) => b.ChoiceTotalVotes() - a.ChoiceTotalVotes()
      );
    });

    return contestsArray.sort((a, b) => a.ContestId - b.ContestId);
  }

  choiceNameFix(choice) {
    if (!choice.OriginalChoiceName) {
      choice.OriginalChoiceName = choice.ChoiceName;
    }
    // Remove party string
    choice.ChoiceName = choice.OriginalChoiceName.replace(/\(.*\)/g, '');

    // Last, First "Nick", Suffix => Nick Last, Suffix
    const nameArray = choice.ChoiceName.split(', ');
    if (nameArray[1]) {
      nameArray[1] = nameArray[1].replace(/.*\"(.*)\"/g, '$1');
      choice.ChoiceName = `${nameArray[1]} ${nameArray[0]}`;
    }
    if (nameArray[2]) {
      choice.ChoiceName += `, ${nameArray[2]}`;
    }
  }

  contestNameFix(contest) {
    contest.ContestName = contest.ContestName.toLowerCase();
    contest.ContestName = contest.ContestName.replace('- district no.', '–');
    contest.ContestName = contest.ContestName.replace('- city of', '–');
    contest.ContestName = contest.ContestName.replace('- town of', '–');
    contest.ContestName = contest.ContestName.replace(' - ', ' – ');
    contest.ContestName = contest.ContestName.replace(' esd', '');
    contest.ContestName = contest.ContestName.replace(' usd', '');
  }

  partyFix(choice) {
    switch (choice.PartyElectionId) {
      case 16:
        choice.PartyElectionId = 'D';
        break;
      case 17:
        choice.PartyElectionId = 'G';
        break;
      case 19:
        choice.PartyElectionId = 'R';
        break;
      case 20:
        choice.PartyElectionId = 'I';
        break;
      default:
        choice.PartyElectionId = '';
        break;
    }
  }

  toggleSettings() {
    this.displaySettings
      .pipe(take(1))
      .subscribe(displaySettings =>
        this.displaySettings.next(!displaySettings)
      );
  }

  showAll() {
    this.results.pipe(take(1)).subscribe(res => {
      res.forEach(contest => {
        if (contest.hidden) {
          contest.hidden = false;
        }
      });
    });
  }

  hideAll() {
    this.results.pipe(take(1)).subscribe(res => {
      res.forEach(contest => {
        if (!contest.hidden) {
          contest.hidden = true;
        }
      });
    });
  }

  hideUncontested() {
    this.results.pipe(take(1)).subscribe(res => {
      res.forEach(contest => {
        if (
          !contest.hidden &&
          contest.NumberToElect &&
          contest.ChoicesArray.length <= contest.NumberToElect
        ) {
          contest.hidden = true;
        }
      });
    });
  }
}
