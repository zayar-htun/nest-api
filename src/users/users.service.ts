import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return [
      {
        id: 1,
        name: 'Mg Mg',
        email: 'mgmg@mgmg.mgmg',
      },
      {
        id: 2,
        name: 'Ag Mg',
        email: 'agmg@agmg.agmg',
      },
    ];
  }
}
