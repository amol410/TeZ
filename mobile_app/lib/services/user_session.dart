import '../models/user_model.dart';
import 'api_service.dart';

/// Lightweight in-memory singleton that tracks the authenticated user.
/// The JWT token itself is persisted in SharedPreferences by [ApiService].
class UserSession {
  UserSession._();
  static final UserSession _instance = UserSession._();
  static UserSession get instance => _instance;

  User? _currentUser;

  User? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  /// Called after a successful login response.
  void setUser(User user) {
    _currentUser = user;
  }

  /// Clears the in-memory user and removes the persisted token.
  Future<void> logout() async {
    _currentUser = null;
    await ApiService.clearAuthToken();
  }

  /// Tries to restore the session by hitting /auth/me with the stored token.
  /// Returns true if the session was restored successfully.
  Future<bool> tryRestore() async {
    try {
      final user = await ApiService.getMe();
      _currentUser = user;
      return true;
    } catch (_) {
      return false;
    }
  }
}
