import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/transfer_status_screen.dart';

final navigatorKey = GlobalKey<NavigatorState>();

void main() {
  runApp(const TezSendApp());
}

class TezSendApp extends StatefulWidget {
  const TezSendApp({super.key});

  @override
  State<TezSendApp> createState() => _TezSendAppState();
}

class _TezSendAppState extends State<TezSendApp> {
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  Future<void> _initDeepLinks() async {
    _appLinks = AppLinks();

    // Check initial link if app was cold-started
    try {
      final initialLink = await _appLinks.getInitialAppLink();
      if (initialLink != null) {
        _handleDeepLink(initialLink);
      }
    } catch (e) {
      debugPrint("Failed to get initial deep link: $e");
    }

    // Handle links while app is running or in background
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(uri);
    }, onError: (err) {
      debugPrint("Failed to get deep link stream: $err");
    });
  }

  void _handleDeepLink(Uri uri) {
    if (uri.path.startsWith('/transferred')) {
      final pathSegments = uri.pathSegments;
      String? txId;
      if (pathSegments.length > 1) {
        txId = pathSegments[1];
      }
      
      if (txId != null) {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (context) => TransferStatusScreen(transactionId: txId),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TezSend Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      navigatorKey: navigatorKey,
      home: const LoginScreen(),
    );
  }
}

