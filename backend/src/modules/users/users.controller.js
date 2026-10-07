import { UsersService } from './users.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class UsersController {
  static getMe = asyncHandler(async (req, res) => {
    const user = await UsersService.getProfile(req.user.userId);
    return ApiResponse.success(res, user, 'User profile fetched successfully.');
  });

  static updateMe = asyncHandler(async (req, res) => {
    const user = await UsersService.updateProfile(req.user.userId, req.body);
    return ApiResponse.success(res, user, 'Profile updated successfully.');
  });

  static getPassport = asyncHandler(async (req, res) => {
    const passport = await UsersService.getPassport(req.params.identifier);
    return ApiResponse.success(res, passport, 'Skill passport retrieved successfully.');
  });
}
