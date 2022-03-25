import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MemoryTokenService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    private jwtService: JwtService,
  ) {}

  async getToken(key: string): Promise<string> {
    const exists = await this.cacheManager.get(key);
    let token = '';
    if (!exists) {
      token = this.jwtService.sign({});
      await this.cacheManager.set(key, token);
    } else {
      token = exists as string;
      try {
        await this.jwtService.verifyAsync(token);
      } catch (e) {
        token = this.jwtService.sign({});
        await this.cacheManager.set(key, token);
      }
    }
    return token;
  }
}
