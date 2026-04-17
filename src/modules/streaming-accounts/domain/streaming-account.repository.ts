import { StreamingAccount } from './streaming-account.entity';

export const STREAMING_ACCOUNT_REPOSITORY = 'STREAMING_ACCOUNT_REPOSITORY';

export interface StreamingAccountRepository {
  findByUserId(userId: string): Promise<StreamingAccount | null>;
  findByProviderAccountId(providerAccountId: string): Promise<StreamingAccount | null>;
  save(account: StreamingAccount): Promise<StreamingAccount>;
}
