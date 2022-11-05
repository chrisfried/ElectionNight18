export class Result {
  state: string;
  countyId: string;
  precinctName: string;
  officeId: string;
  officeName: string;
  district: string;
  candidateOrderCode: string;
  candidateName: string;
  suffix: string;
  incumbentCode: string;
  partyAbbreviation: string;
  precinctsReporting: string;
  totalPrecincts: string;
  votes: string;
  votesPercentage: string;
  totalVotes: string;
}

export type Races =
  | 'USPres'
  | 'Governor'
  | 'secofstate'
  | 'attorneygen'
  | 'auditor'
  | 'ushouse'
  | 'ussenate'
  | 'stsenate'
  | 'LegislativeByDistrict';

export class ResultsResponse {
  data: Result[];
  errors: any;
  meta: any;
}
