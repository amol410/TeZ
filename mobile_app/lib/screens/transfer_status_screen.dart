import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_widgets.dart';

class TransferStatusScreen extends StatefulWidget {
  final String transactionId;

  const TransferStatusScreen({super.key, required this.transactionId});

  @override
  State<TransferStatusScreen> createState() => _TransferStatusScreenState();
}

class _TransferStatusScreenState extends State<TransferStatusScreen> {
  bool _isLoading = true;
  bool _isSuccess = false;
  String _message = 'Verifying transaction...';

  @override
  void initState() {
    super.initState();
    _verifyTransaction();
  }

  Future<void> _verifyTransaction() async {
    // Simulate network delay for verification
    // In reality, you would call an API like ApiService.verifyTransaction(widget.transactionId)
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      setState(() {
        _isLoading = false;
        // Mocking a successful validation for now since backend doesn't have a specific verify endpoint yet
        _isSuccess = true;
        _message = 'Transfer Successful!';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgBase,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Transfer Status'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _isLoading
              ? Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(color: AppTheme.brand),
                    const SizedBox(height: 24),
                    Text(
                      _message,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),
                  ],
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _isSuccess ? Icons.check_circle : Icons.error,
                      color: _isSuccess ? Colors.green : Colors.red,
                      size: 80,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      _message,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Transaction ID: ${widget.transactionId}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 48),
                    GradientButton(
                      text: 'Back to Home',
                      onPressed: () {
                        // Pop back to root (Dashboard)
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
