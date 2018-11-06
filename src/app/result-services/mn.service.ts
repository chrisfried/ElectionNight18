import { Injectable } from '@angular/core';
import { of, forkJoin, interval, BehaviorSubject, merge } from 'rxjs';
import { map, switchMap, catchError, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MnService {
  displaySettings: BehaviorSubject<boolean> = new BehaviorSubject(false);
  scrollInterval = interval(20000);

  contests = {
    'County Contests': {},
    'City Contests': {
      groupArray: []
    },
    'Township Contests': {
      groupArray: []
    }
  };
  contestGroups = [];
  contestsArray = [];
  counties = [];

  race = 115;
  getCounties = this.http
    .get(`/Results/MediaSupportResult/${this.race}?mediafileid=6`, {
      responseType: 'text'
    })
    .pipe(
      map(countiesRaw => {
        const countiesArray = countiesRaw.split('\n');
        countiesArray.forEach(countyRaw => {
          const countyArray = countyRaw.split(';');
          if (countyArray.length < 3) {
            return;
          }
          const county = {
            CountyID: countyArray[0],
            CountyName: countyArray[1],
            NumberOfPrecincts: countyArray[2]
          };
          this.counties.push(county);
        });
      })
    )
    .subscribe();
  lists = [
    23, // US Senate Statewide
    // 41, // US Senate by Congressional District
    // 27, // US Senate by County
    // 28, // US Senate by Precinct
    24, // US House by District
    // 60, // US House by County
    // 29, // US House by Precinct
    56, // Governor Statewide
    // 39, // Governor by Precinct
    34, // Secretary of State
    35, // AG
    36, // State Auditor
    30, // State Senate by District
    // 16, // State Senate by Precinct
    20, // State House by District
    // 21, // State House by Precinct
    37, // Supreme Court
    44, // District Court
    // 10, // County Races
    88, // County Races and Questions
    // 14, // Municipal Questions
    1, // Municipal and Hospital District and Questions
    // 9, // Municipal, Hospital, School District by Precinct
    // 90, // Hospital District
    57, // School Board
    17 // School Referendum and Bond Questions
    // 7, // School Board and Questions
    // 93, // Precinct Reporting Stats
    // 38, // All Federal, State, and County Races by County
    // 13, // All Federal, State, and County Races by Precinct
  ];
  checkHttp = of(this.lists).pipe(
    switchMap(lists => {
      const requests = [];
      lists.forEach(list => {
        requests.push(
          this.http.get(
            `/Results/MediaSupportResult/${this.race}?mediafileid=${list}`,
            { responseType: 'text' }
          )
        );
      });

      return forkJoin(requests);
    })
  );
  checkInterval = interval(30000).pipe(
    switchMap(res => this.checkHttp),
    catchError(e => {
      console.error(e);
      return of([]);
    })
  );
  results = merge(this.checkHttp, this.checkInterval).pipe(
    map(resultsArray => {
      resultsArray.forEach(res => {
        const resArray = res.split('\n');
        resArray.forEach(contestRaw => {
          const contestArray = contestRaw.split(';');
          if (contestArray.length < 16) {
            return;
          }
          const contest = {
            State: contestArray[0],
            CountyID: contestArray[1],
            PrecinctName: contestArray[2],
            OfficeID: contestArray[3],
            OfficeName: contestArray[4],
            District: contestArray[5],
            CandidateOrderCode: contestArray[6],
            CandidateName: contestArray[7],
            Suffix: contestArray[8],
            IncumbentCode: contestArray[9],
            PartyAbbreviation: contestArray[10],
            NumberOfPrecinctsReporting: parseInt(contestArray[11], 10),
            TotalNumberOfPrecinctsVotingForTheOffice: parseInt(
              contestArray[12],
              10
            ),
            VotesForCandidate: parseInt(contestArray[13], 10),
            PercentageOfVotesForCandidateOutOfTotalVotesForOffice:
              contestArray[14],
            TotalNumberOfVotesForOfficeInArea: parseInt(contestArray[15], 10)
          };
          const {
            State,
            CountyID,
            PrecinctName,
            OfficeID,
            OfficeName,
            District,
            CandidateOrderCode,
            CandidateName,
            PartyAbbreviation,
            NumberOfPrecinctsReporting,
            TotalNumberOfPrecinctsVotingForTheOffice,
            VotesForCandidate,
            PercentageOfVotesForCandidateOutOfTotalVotesForOffice,
            TotalNumberOfVotesForOfficeInArea
          } = contest;
          const uid = CountyID + OfficeID + District;

          let list;
          let hidden = true;

          if (CountyID) {
            if (!this.contests['County Contests'][CountyID]) {
              this.contests['County Contests'][CountyID] = {
                groupArray: []
              };
            }
            list = this.contests['County Contests'][CountyID];
          } else {
            let listName = 'Other';

            if (OfficeName.includes('U.S. Senator')) {
              listName = 'Statewide Contests';
              hidden = false;
            } else if (OfficeName.includes('U.S. Representative')) {
              listName = 'U.S. Representatives';
              hidden = false;
            } else if (OfficeName.includes('State Senator')) {
              listName = 'State Senators';
            } else if (OfficeName.includes('State Representative')) {
              listName = 'State Representatives';
            } else if (OfficeName.includes('Governor & Lt Governor')) {
              listName = 'Statewide Contests';
              hidden = false;
            } else if (OfficeName.includes('Secretary of State')) {
              listName = 'Statewide Contests';
              hidden = false;
            } else if (OfficeName.includes('State Auditor')) {
              listName = 'Statewide Contests';
              hidden = false;
            } else if (OfficeName.includes('Attorney General')) {
              listName = 'Statewide Contests';
              hidden = false;
            } else if (OfficeName.includes('School Board Member')) {
              listName = 'School Boards';
            } else if (OfficeName.includes('SCHOOL DISTRICT QUESTION')) {
              listName = 'School District Questions';
            } else if (OfficeName.includes('Supreme Court')) {
              listName = 'Supreme Court';
            } else if (OfficeName.includes('Court of Appeals')) {
              listName = 'Court of Appeals';
            } else if (OfficeName.includes('District Court')) {
              listName = 'District Courts';
            } else if (OfficeName.includes('Court of Appeals')) {
              listName = 'Court of Appeals';
            }

            if (!this.contests[listName]) {
              this.contests[listName] = {
                groupArray: []
              };
              this.contestGroups.push(listName);
            }
            list = this.contests[listName];
          }

          if (list === this.contests['Other']) {
            const match = /\((?!Elect)(.*?)\)/g.exec(OfficeName);
            if (match) {
              const municipality = match[1];
              if (municipality.includes('Township')) {
                if (!this.contests['Township Contests'][municipality]) {
                  this.contests['Township Contests'][municipality] = {
                    municipality,
                    groupArray: []
                  };
                  this.contests['Township Contests'].groupArray.push(
                    this.contests['Township Contests'][municipality]
                  );
                }
                list = this.contests['Township Contests'][municipality];
              } else {
                if (!this.contests['City Contests'][municipality]) {
                  this.contests['City Contests'][municipality] = {
                    municipality,
                    groupArray: []
                  };
                  this.contests['City Contests'].groupArray.push(
                    this.contests['City Contests'][municipality]
                  );
                }
                list = this.contests['City Contests'][municipality];
              }
            }
          }

          if (!list[uid]) {
            list[uid] = {
              State,
              CountyID,
              PrecinctName,
              OfficeID,
              OfficeName,
              District,
              NumberOfPrecinctsReporting,
              TotalNumberOfPrecinctsVotingForTheOffice,
              TotalNumberOfVotesForOfficeInArea,
              hidden,
              Choices: {},
              ChoicesArray: []
            };
            this.contestsArray.push(list[uid]);
            list.groupArray.push(list[uid]);
          } else {
            list[uid].NumberOfPrecinctsReporting = NumberOfPrecinctsReporting;
            list[
              uid
            ].NumberOfPrecinctsReporting = TotalNumberOfVotesForOfficeInArea;
          }
          if (!list[uid].Choices[CandidateName]) {
            list[uid].Choices[CandidateName] = {
              CandidateOrderCode,
              CandidateName,
              PartyAbbreviation,
              VotesForCandidate,
              PercentageOfVotesForCandidateOutOfTotalVotesForOffice
            };
            list[uid].ChoicesArray.push(list[uid].Choices[CandidateName]);
          } else {
            list[uid].Choices[
              CandidateName
            ].VotesForCandidate = VotesForCandidate;
            list[uid].Choices[
              CandidateName
            ].PercentageOfVotesForCandidateOutOfTotalVotesForOffice = PercentageOfVotesForCandidateOutOfTotalVotesForOffice;
          }
          list[uid].ChoicesArray.sort(
            (a, b) => b.VotesForCandidate - a.VotesForCandidate
          );
        });
      });

      return [...this.contestsArray];
    })
  );

  constructor(private http: HttpClient) {}

  toggleSettings() {
    this.displaySettings
      .pipe(take(1))
      .subscribe(displaySettings =>
        this.displaySettings.next(!displaySettings)
      );
  }
}
