import { TestBed } from '@angular/core/testing';

import { AzService } from './az.service';

describe('AzService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AzService = TestBed.get(AzService);
    expect(service).toBeTruthy();
  });
});
