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
        return 'U.S. Senate';
      case 'C':
        return 'U.S. House';
      case 'D':
        return 'M.N. Senate';
      case 'E':
        return 'M.N. House';
    }
    return null;
  }
}
