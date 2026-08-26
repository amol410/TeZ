import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors
  static const Color bgBase = Color(0xFF060B14);
  static const Color bgSurface = Color(0xFF0D1829);
  static const Color bgElevated = Color(0xFF152236);
  static const Color brand = Color(0xFF4F8EFF);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color green = Color(0xFF10B981);
  static const Color emerald = Color(0xFF4EDEA3);
  static const Color red = Color(0xFFEF4444);

  // Text Colors
  static const Color textPrimary = Color(0xFFF0F6FF);
  static const Color textSecondary = Color(0xFF6B8CA8);
  static const Color textMuted = Color(0xFF3D5A78);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgBase,
      primaryColor: brand,
      colorScheme: const ColorScheme.dark(
        primary: brand,
        secondary: purple,
        surface: bgSurface,
        error: red,
      ),
      fontFamily: 'Inter',
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w700),
        bodyLarge: TextStyle(color: textPrimary),
        bodyMedium: TextStyle(color: textSecondary),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: bgSurface,
        selectedItemColor: brand,
        unselectedItemColor: textSecondary,
        elevation: 10,
      ),
    );
  }

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [brand, purple],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
