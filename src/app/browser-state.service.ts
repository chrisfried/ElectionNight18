import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BrowserStateService {
  hiddenRaces: string[];
  activeCounty: number;

  constructor() {
    const oldSettings = JSON.parse(
      localStorage.getItem('electionNightSettings')
    );
    if (!oldSettings) {
    }
  }
}
