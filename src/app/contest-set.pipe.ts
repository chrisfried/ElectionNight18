import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'contestSet',
})
export class ContestSetPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    switch (value) {
      case 'A':
        return 'U.S. President';
      case 'B':
        return 'Governor';
      case 'C':
        return 'Secretary of State';
      case 'D':
        return 'Attorney General';
      case 'E':
        return 'State Auditor';
      case 'F':
        return 'U.S. Senate';
      case 'G':
        return 'U.S. House';
      case 'H':
        return 'M.N. Senate';
      case 'I':
        return 'M.N. House';
    }
    return null;
  }
}
