import { AuthService } from './auth.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class AuthController {
  static register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, role } = req.body;
    const result = await AuthService.register({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return ApiResponse.created(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'User registered successfully.'
    );
  });

  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await AuthService.login({ email, password, ipAddress, userAgent });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Login successful.'
    );
  });

  static refresh = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const tokens = await AuthService.refreshToken(incomingToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(
      res,
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Token refreshed successfully.'
    );
  });

  static logout = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    await AuthService.logout(userId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return ApiResponse.success(res, null, 'Logged out successfully.');
  });

  static getMe = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const user = await AuthService.getMe(userId);
    return ApiResponse.success(res, { user }, 'User profile retrieved.');
  });

  static firebaseLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const result = await AuthService.firebaseSync({ idToken });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
      },
      result.isNewUser ? 'User registered and linked via Firebase.' : 'Login successful via Firebase.'
    );
  });
}
