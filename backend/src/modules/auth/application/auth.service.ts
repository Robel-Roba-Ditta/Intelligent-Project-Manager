import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../modules/user/application/user.service';
import { User } from '../../../modules/user/domain/user.entity';
import { RegisterDto } from '../api/dto/register.dto';
import { LoginDto } from '../api/dto/login.dto';

const SALT_ROUNDS = 10;

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  private sanitize(user: User): SafeUser {
    const { password, ...safe } = user;
    return safe;
  }

  async register(dto: RegisterDto): Promise<{ user: SafeUser; accessToken: string }> {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {

      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.userService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
    });

    const safeUser = this.sanitize(user);
    const accessToken = this.signToken(safeUser);
    return { user: safeUser, accessToken };
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; accessToken: string }> {

    const user = await this.userService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser = this.sanitize(user);
    const accessToken = this.signToken(safeUser);
    return { user: safeUser, accessToken };
  }

  private signToken(user: SafeUser): string {

    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  async getProfile(userId: number): Promise<SafeUser> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.sanitize(user);
  }
}
