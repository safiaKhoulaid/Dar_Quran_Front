import { User } from './user.module';

export interface UserCreateRequest extends User {
  password: string;
  passwordConfirmation?: string;
}
