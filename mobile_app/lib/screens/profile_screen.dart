import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/user_session.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _handleLogout(BuildContext context) async {
    await UserSession.instance.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Widget _buildListTile(IconData icon, String title, {VoidCallback? onTap, bool isDestructive = false}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDestructive ? AppTheme.red.withValues(alpha: 0.1) : AppTheme.brand.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: isDestructive ? AppTheme.red : AppTheme.brand, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isDestructive ? AppTheme.red : AppTheme.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = UserSession.instance.currentUser;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 24),
              // Avatar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.brand.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    user?.initials ?? 'U',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                user?.name ?? 'User',
                style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                user?.email ?? '',
                style: const TextStyle(
                    fontSize: 14, color: AppTheme.textSecondary),
              ),
              if (user?.phone != null) ...[
                const SizedBox(height: 4),
                Text(
                  user!.phone!,
                  style: const TextStyle(
                      fontSize: 14, color: AppTheme.textSecondary),
                ),
              ],
              const SizedBox(height: 40),
              
              // Menu
              _buildListTile(Icons.person_outline, 'Account Details', onTap: () {}),
              Divider(color: Colors.white.withValues(alpha: 0.05), height: 1),
              _buildListTile(Icons.people_outline, 'Beneficiaries', onTap: () {}),
              Divider(color: Colors.white.withValues(alpha: 0.05), height: 1),
              _buildListTile(Icons.help_outline, 'Help & Support', onTap: () {}),
              Divider(color: Colors.white.withValues(alpha: 0.05), height: 1),
              _buildListTile(Icons.logout, 'Logout', isDestructive: true, onTap: () => _handleLogout(context)),
            ],
          ),
        ),
      ),
    );
  }
}
