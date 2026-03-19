import { User } from "@core/models/users/user.module";
import { UserCreateRequest } from "@core/models/users/userCreateRequest.module";

export type UserUpdateRequest = {
  id: string;
  user?: Partial<User>;
} & Partial<Omit<UserCreateRequest, 'user'>>;
