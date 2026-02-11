import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { MembershipPublicController } from './membership-public.controller';

@Module({
  controllers: [MembershipController, MembershipPublicController],
  providers: [MembershipService],
})
export class MembershipModule {}
