import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthDto } from './dto/auth.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,
    private jwtService: JwtService,
  ) {}

  async signUp(registerDto: RegisterDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
      options: {
        data: {
          username: registerDto.username,
          full_name: registerDto.fullName,
          role: registerDto.role,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async signIn(authDto: AuthDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: authDto.email,
      password: authDto.password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    const payload = {
      sub: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: data.user,
    };
  }

  async signOut(jwt: string) {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Successfully signed out' };
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Password reset email sent' };
  }

  async updatePassword(newPassword: string, jwt: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Password updated successfully' };
  }

  async verifyEmail(token: string) {
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) {
      throw new Error(error.message);
    }

    return { message: 'Email verified successfully' };
  }
}