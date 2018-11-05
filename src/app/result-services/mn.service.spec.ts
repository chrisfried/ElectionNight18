import { TestBed } from '@angular/core/testing';

import { MnService } from './mn.service';

describe('MnService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MnService = TestBed.get(MnService);
    expect(service).toBeTruthy();
  });
});
