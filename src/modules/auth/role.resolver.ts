import { Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { Role } from '../../common/dto/entities/auth/role.dto';
import { RoleService } from './role.service';

@Resolver(() => Role)
@Injectable()
export class RoleResolver {
    constructor(private roleService: RoleService) {}

    @Query(() => [Role])
    @UseGuards(GqlAuthGuard)
    async getRoles(): Promise<Role[]> {
        return this.roleService.findAll();
    }
}
