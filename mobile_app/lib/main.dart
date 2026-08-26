import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const TezSendApp());
}

class TezSendApp extends StatelessWidget {
  const TezSendApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TezSend Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const LoginScreen(),
    );
  }
}

