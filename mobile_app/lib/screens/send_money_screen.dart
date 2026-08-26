import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/beneficiary_model.dart';
import '../widgets/custom_widgets.dart';

class SendMoneyScreen extends StatefulWidget {
  const SendMoneyScreen({super.key});

  @override
  State<SendMoneyScreen> createState() => _SendMoneyScreenState();
}

class _SendMoneyScreenState extends State<SendMoneyScreen> {
  int _step = 1; // 1: Pick beneficiary, 2: Enter amount
  
  // Step 1 state
  List<Beneficiary> _beneficiaries = [];
  bool _isLoadingBens = true;
  String? _bensError;
  Beneficiary? _selectedBeneficiary;

  // Step 2 state
  final TextEditingController _amountController = TextEditingController();
  bool _isSending = false;
  String? _sendError;
  double _fee = 0;

  @override
  void initState() {
    super.initState();
    _loadBeneficiaries();
    _amountController.addListener(_updateFee);
  }

  @override
  void dispose() {
    _amountController.removeListener(_updateFee);
    _amountController.dispose();
    super.dispose();
  }

  void _updateFee() {
    final amt = double.tryParse(_amountController.text) ?? 0;
    setState(() {
      _fee = amt * 0.02; // 2% convenience fee
    });
  }

  Future<void> _loadBeneficiaries() async {
    setState(() {
      _isLoadingBens = true;
      _bensError = null;
    });
    try {
      final bens = await ApiService.getBeneficiaries();
      if (!mounted) return;
      setState(() {
        _beneficiaries = bens;
        _isLoadingBens = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _bensError = e.toString().replaceFirst('Exception: ', '');
        _isLoadingBens = false;
      });
    }
  }

  void _showAddBeneficiarySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddBeneficiarySheet(),
    ).then((added) {
      if (added == true) {
        _loadBeneficiaries();
      }
    });
  }

  Future<void> _handleSend() async {
    final amt = double.tryParse(_amountController.text);
    if (amt == null || amt <= 0) {
      setState(() => _sendError = 'Please enter a valid amount');
      return;
    }

    setState(() {
      _isSending = true;
      _sendError = null;
    });

    try {
      await ApiService.initiateTransaction(_selectedBeneficiary!.id, amt);
      if (!mounted) return;
      
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.bgElevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Icon(Icons.check_circle, color: AppTheme.green, size: 64),
          content: const Text(
            'Transaction successful!',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textPrimary, fontSize: 18),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close dialog
                Navigator.of(context).pop(); // Close Send screen
              },
              child: const Text('Done', style: TextStyle(color: AppTheme.brand)),
            ),
          ],
        )
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sendError = e.toString().replaceFirst('Exception: ', '');
        _isSending = false;
      });
    }
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Select Beneficiary',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary)),
            TextButton(
              onPressed: _showAddBeneficiarySheet,
              child: const Text('Add New', style: TextStyle(color: AppTheme.brand)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_isLoadingBens)
          const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
        else if (_bensError != null)
          Text(_bensError!, style: const TextStyle(color: AppTheme.red))
        else if (_beneficiaries.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Column(
                children: [
                  const Icon(Icons.people_outline, size: 48, color: AppTheme.textMuted),
                  const SizedBox(height: 12),
                  const Text('No beneficiaries found',
                      style: TextStyle(color: AppTheme.textSecondary)),
                ],
              ),
            ),
          )
        else
          Expanded(
            child: ListView.builder(
              itemCount: _beneficiaries.length,
              itemBuilder: (context, index) {
                final ben = _beneficiaries[index];
                return ListTile(
                  onTap: () {
                    setState(() {
                      _selectedBeneficiary = ben;
                      _step = 2;
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.bgElevated,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                        ben.type == 'UPI' ? Icons.qr_code : Icons.account_balance,
                        color: AppTheme.textPrimary),
                  ),
                  title: Text(ben.displayName,
                      style: const TextStyle(color: AppTheme.textPrimary)),
                  subtitle: Text(ben.type,
                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildStep2() {
    final amt = double.tryParse(_amountController.text) ?? 0;
    final total = amt + _fee;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() {
                  _step = 1;
                  _sendError = null;
                }),
                color: AppTheme.textPrimary,
              ),
              const Text('Enter Amount',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary)),
            ],
          ),
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.bgElevated,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.brand.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    _selectedBeneficiary!.type == 'UPI' ? Icons.qr_code : Icons.account_balance,
                    color: AppTheme.brand,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Sending to', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      Text(
                        _selectedBeneficiary!.displayName,
                        style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          Center(
            child: IntrinsicWidth(
              child: TextField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
                decoration: const InputDecoration(
                  prefixText: '₹',
                  prefixStyle: TextStyle(fontSize: 48, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                  border: InputBorder.none,
                  hintText: '0',
                  hintStyle: TextStyle(color: AppTheme.textMuted),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Amount', style: TextStyle(color: AppTheme.textSecondary)),
                    Text('₹${amt.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.textPrimary)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Convenience Fee', style: TextStyle(color: AppTheme.textSecondary)),
                    Text('₹${_fee.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.textPrimary)),
                  ],
                ),
                const Divider(height: 24, color: AppTheme.textMuted),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total to Pay', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold)),
                    Text('₹${total.toStringAsFixed(2)}', style: const TextStyle(color: AppTheme.brand, fontWeight: FontWeight.bold, fontSize: 18)),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          
          if (_sendError != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppTheme.red.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.red.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.red, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_sendError!, style: const TextStyle(color: AppTheme.red, fontSize: 13)),
                  ),
                ],
              ),
            ),
            
          GradientButton(
            text: 'Send Money',
            isLoading: _isSending,
            onPressed: total > 0 ? _handleSend : () {},
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Money',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: _step == 1 ? _buildStep1() : _buildStep2(),
        ),
      ),
    );
  }
}

class _AddBeneficiarySheet extends StatefulWidget {
  const _AddBeneficiarySheet();

  @override
  State<_AddBeneficiarySheet> createState() => _AddBeneficiarySheetState();
}

class _AddBeneficiarySheetState extends State<_AddBeneficiarySheet> {
  String _type = 'UPI'; // UPI | BANK
  
  final TextEditingController _upiIdController = TextEditingController();
  final TextEditingController _accountNoController = TextEditingController();
  final TextEditingController _ifscController = TextEditingController();
  final TextEditingController _bankNameController = TextEditingController();
  
  bool _isLoading = false;
  String? _error;

  Future<void> _handleAdd() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ApiService.addBeneficiary(
        type: _type,
        upiId: _type == 'UPI' ? _upiIdController.text.trim() : null,
        accountNo: _type == 'BANK' ? _accountNoController.text.trim() : null,
        ifsc: _type == 'BANK' ? _ifscController.text.trim() : null,
        bankName: _type == 'BANK' ? _bankNameController.text.trim() : null,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add Beneficiary',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary)),
              const SizedBox(height: 24),
              
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _type = 'UPI'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _type == 'UPI' ? AppTheme.brand.withValues(alpha: 0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _type == 'UPI' ? AppTheme.brand : Colors.transparent),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(_type == 'UPI' ? Icons.radio_button_checked : Icons.radio_button_unchecked, 
                                 color: _type == 'UPI' ? AppTheme.brand : AppTheme.textMuted, size: 20),
                            const SizedBox(width: 8),
                            Text('UPI', style: TextStyle(color: _type == 'UPI' ? AppTheme.brand : AppTheme.textPrimary, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _type = 'BANK'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _type == 'BANK' ? AppTheme.brand.withValues(alpha: 0.1) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _type == 'BANK' ? AppTheme.brand : Colors.transparent),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(_type == 'BANK' ? Icons.radio_button_checked : Icons.radio_button_unchecked, 
                                 color: _type == 'BANK' ? AppTheme.brand : AppTheme.textMuted, size: 20),
                            const SizedBox(width: 8),
                            Text('Bank', style: TextStyle(color: _type == 'BANK' ? AppTheme.brand : AppTheme.textPrimary, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              if (_type == 'UPI')
                CustomTextField(
                  controller: _upiIdController,
                  label: 'UPI ID',
                  icon: Icons.qr_code,
                )
              else ...[
                CustomTextField(
                  controller: _accountNoController,
                  label: 'Account Number',
                  icon: Icons.numbers,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _ifscController,
                  label: 'IFSC Code',
                  icon: Icons.account_balance,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _bankNameController,
                  label: 'Bank Name',
                  icon: Icons.business,
                ),
              ],
              
              const SizedBox(height: 24),
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.red.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: AppTheme.red.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppTheme.red, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_error!,
                            style: const TextStyle(
                                color: AppTheme.red, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
                
              GradientButton(
                text: 'Add Beneficiary',
                isLoading: _isLoading,
                onPressed: _handleAdd,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
