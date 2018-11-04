import { Injectable } from '@angular/core';
import * as staticData from '../../assets/mock/az/all_county_races_4_0_en_6689.json';
import * as staticData2 from '../../assets/mock/az/all_county_races_4_0_en_6730.json';
import * as countyData1 from '../../assets/mock/az/all_county_races_4_11_en_6754.json';
import * as stateData3 from '../../assets/mock/az/all_races_4_0_en_6730.json';
import * as countyData3 from '../../assets/mock/az/all_races_4_11_en_6754.json';
import { of, interval, BehaviorSubject, combineLatest, merge } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AzService {
  dataset = false;
  hidden: BehaviorSubject<number[]> = new BehaviorSubject([50]);
  showHidden: BehaviorSubject<boolean> = new BehaviorSubject(false);

  counties = {};
  countyArray = [];
  countiesBS = new BehaviorSubject([]);

  countyData = of(countyData1);

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

  stateData = merge(this.dataInitial, this.data);

  stateDataAll = of(stateData3);
  countyDataAll = of(countyData3);

  unfilteredResults = combineLatest(this.stateData, this.countyData).pipe(
    map(([state, county]: [any, any]) => {
      return [...state.default, ...county.default];
    }),
    map(data => {
      const contests = {};
      let contestArray = [];

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
          this.countyArray = [...this.countyArray, this.counties[CountyId]];
          this.countyArray.sort((a, b) => a.CountyId - b.CountyId);
          this.countiesBS.next(this.countyArray);
        }

        if (!contests[ContestId]) {
          contests[ContestId] = {
            ContestId,
            ContestName,
            NumberToElect,
            PrecinctsParticipating,
            PrecinctsReported,
            Choices: {
              [ChoiceName]: {
                ChoiceName,
                ChoiceTotalVotes,
                PartyElectionId,
                PrecinctsParticipating,
                PrecinctsReported
              }
            },
            byCounty: {
              [CountyId]: {
                [ChoiceName]: item
              }
            }
          };
          contestArray = [...contestArray, contests[ContestId]];

          contests[ContestId].ContestName = contests[
            ContestId
          ].ContestName.replace('- District No.', '–');
          contests[ContestId].ChoiceArray = [
            contests[ContestId].Choices[ChoiceName]
          ];
        } else {
          if (!contests[ContestId].byCounty[CountyId]) {
            contests[ContestId].byCounty[CountyId] = {
              [ChoiceName]: item
            };
          } else {
            contests[ContestId].byCounty[CountyId][ChoiceName] = item;
          }

          if (!contests[ContestId].Choices[ChoiceName]) {
            contests[ContestId].Choices[ChoiceName] = {
              ChoiceName,
              ChoiceTotalVotes,
              PartyElectionId,
              PrecinctsParticipating,
              PrecinctsReported
            };
            contests[ContestId].ChoiceArray = [
              ...contests[ContestId].ChoiceArray,
              contests[ContestId].Choices[ChoiceName]
            ];
          } else {
            contests[ContestId].Choices[
              ChoiceName
            ].ChoiceTotalVotes += ChoiceTotalVotes;
            contests[ContestId].Choices[
              ChoiceName
            ].PrecinctsParticipating += PrecinctsParticipating;
            contests[ContestId].Choices[
              ChoiceName
            ].PrecinctsReported += PrecinctsReported;
          }
        }

        contests[ContestId].PrecinctsParticipating =
          contests[ContestId].Choices[ChoiceName].PrecinctsParticipating;
        contests[ContestId].PrecinctsReported =
          contests[ContestId].Choices[ChoiceName].PrecinctsReported;
      });

      contestArray.forEach(contest => {
        contest.ContestTotalVotes = 0;
        contest.ChoiceArray.forEach(choice => {
          contest.ContestTotalVotes += choice.ChoiceTotalVotes;
        });

        contest.ChoiceArray.sort(
          (a, b) => b.ChoiceTotalVotes - a.ChoiceTotalVotes
        );
      });

      return contestArray.sort((a, b) => a.ContestId - b.ContestId);
    })
  );

  earlyBallots = combineLatest(this.stateDataAll, this.countyDataAll).pipe(
    map(([state, county]: [any, any]) => {
      return [...state.default, ...county.default];
    })
  );

  unfilteredEarlyBallots = combineLatest(
    this.unfilteredResults,
    this.earlyBallots
  ).pipe(
    map(([contestArray, earlyBallots]) => {
      contestArray.forEach(contest => {
        const earlyContest = earlyBallots.find(
          item => item.ContestId === contest.ContestId
        );
        contest.ChoiceArray.forEach(choice => {
          const earlyChoice = earlyContest.Choices.find(
            item2 => item2.ChoiceName === choice.ChoiceName
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

  namePartyFix = this.unfilteredEarlyBallots.pipe(
    map(contestArray => {
      contestArray.forEach(contest => {
          contest.ChoiceArray.forEach(choice => {
            const { ChoiceName } = choice;

            this.nameFix(contest.Choices[ChoiceName]);
            this.partyFix(contest.Choices[ChoiceName]);
          });
      });
      return contestArray;
    })
  );

  results = combineLatest(this.namePartyFix, this.hidden, this.showHidden).pipe(
    map(([contestArray, hidden, showHidden]) => {
      let prunedArray = [];
      contestArray.forEach(contest => {
        if (hidden.includes(contest.ContestId)) {
          contest.hidden = true;
        } else {
          contest.hidden = false;
        }
        if (showHidden || !contest.hidden) {
          prunedArray = [...prunedArray, contest];
        }
      });

      return prunedArray;
    })
  );

  constructor() {}

  nameFix(choice) {
    choice.OriginalChoiceName = choice.ChoiceName;
    // Remove party string
    choice.ChoiceName = choice.ChoiceName.replace(/\(.*\)/g, '');

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

  toggleContest(contest: number) {
    this.hidden.pipe(take(1)).subscribe(hidden => {
      if (hidden.includes(contest)) {
        hidden.splice(hidden.indexOf(contest), 1);
        this.hidden.next([...hidden]);
      } else {
        this.hidden.next([...hidden, contest]);
      }
    });
  }

  toggleShowHidden() {
    this.showHidden
      .pipe(take(1))
      .subscribe(showHidden => this.showHidden.next(!showHidden));
  }

  showAll() {
    this.hidden.next([]);
  }

  hideAll() {
    this.results.pipe(take(1)).subscribe(res => {
      res.forEach(contest => {
        if (!contest.hidden) {
          this.toggleContest(contest.ContestId);
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
          contest.ChoiceArray.length <= contest.NumberToElect
        ) {
          this.toggleContest(contest.ContestId);
        }
      });
    });
  }
}
