import { User } from '@core/domain/entities/user.entity';
import { IRepository } from '@core/interfaces/repository.interface';
import { UserCreateDto, UserQueryDto, UserUpdateDto } from '../user.dto';

export type IUserRepository = IRepository<User, UserQueryDto, UserCreateDto, UserUpdateDto>;
