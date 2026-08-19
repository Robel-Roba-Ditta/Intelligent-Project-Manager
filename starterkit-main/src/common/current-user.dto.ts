import { FileDto } from './dto/file-dto';

export class CurrentUserDto {
  id!: string;
  email?: string;
  firstName!: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  profilePicture?: FileDto;
  userType?: string;
  country?: string;
  state?: string;
  city?: string;
}
