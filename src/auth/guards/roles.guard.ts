// import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Observable } from 'rxjs';
// import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
// import { Role } from '../../generated/prisma/enums.js';
// import { ROLES_KEY } from '../decorators/roles.decorator.js';

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private readonly reflector: Reflector) {}

//   canActivate(
//     context: ExecutionContext,
//   ): boolean | Promise<boolean> | Observable<boolean> {
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       return true;
//     }

//     const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
//         ROLES_KEY,[
//             context.getHandler(),
//             context.getClass(),
//         ]
//     );

//     if(!requiredRoles?.length){
//         return true;
//     }
// }
