import { TestBed } from '@angular/core/testing';

import { BrowserStateService } from './browser-state.service';

describe('BrowserStateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BrowserStateService = TestBed.get(BrowserStateService);
    expect(service).toBeTruthy();
  });
});
