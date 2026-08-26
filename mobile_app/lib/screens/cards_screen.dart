import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../models/card_model.dart';
import '../widgets/custom_widgets.dart';

class CardsScreen extends StatefulWidget {
  const CardsScreen({super.key});

  @override
  State<CardsScreen> createState() => _CardsScreenState();
}

class _CardsScreenState extends State<CardsScreen> {
  List<AppCard> _cards = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final cards = await ApiService.getCards();
      if (!mounted) return;
      setState(() {
        _cards = cards;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _showAddCardSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddCardSheet(),
    ).then((added) {
      if (added == true) {
        _loadData();
      }
    });
  }

  Widget _buildCard(AppCard card) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      height: 180,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.brand.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(Icons.contactless, color: Colors.white, size: 28),
              Text(
                card.network.toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    fontStyle: FontStyle.italic),
              ),
            ],
          ),
          Text(
            '•••• •••• •••• ${card.last4}',
            style: const TextStyle(
                color: Colors.white, fontSize: 20, letterSpacing: 2),
          ),
          const Text(
            'TezSend Physical Card',
            style: TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Cards',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCardSheet,
        backgroundColor: AppTheme.brand,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: AppTheme.brand,
          backgroundColor: AppTheme.bgSurface,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? ListView(
                      padding: const EdgeInsets.all(24),
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppTheme.red.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline,
                                  color: AppTheme.red, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_error!,
                                    style:
                                        const TextStyle(color: AppTheme.red)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : _cards.isEmpty
                      ? ListView(
                          children: [
                            SizedBox(
                                height:
                                    MediaQuery.of(context).size.height * 0.3),
                            const Icon(Icons.credit_card_outlined,
                                size: 64, color: AppTheme.textMuted),
                            const SizedBox(height: 16),
                            const Center(
                              child: Text('No cards added yet',
                                  style: TextStyle(
                                      color: AppTheme.textSecondary,
                                      fontSize: 16)),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(24.0),
                          itemCount: _cards.length,
                          itemBuilder: (context, index) {
                            return _buildCard(_cards[index]);
                          },
                        ),
        ),
      ),
    );
  }
}

class _AddCardSheet extends StatefulWidget {
  const _AddCardSheet();

  @override
  State<_AddCardSheet> createState() => _AddCardSheetState();
}

class _AddCardSheetState extends State<_AddCardSheet> {
  final TextEditingController _last4Controller = TextEditingController();
  String _network = 'VISA';
  bool _isLoading = false;
  String? _error;

  Future<void> _handleAdd() async {
    final last4 = _last4Controller.text.trim();
    if (last4.length != 4) {
      setState(() => _error = 'Please enter a 4-digit card ending');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final token = 'tok_${DateTime.now().millisecondsSinceEpoch}';
      await ApiService.addCard(token: token, last4: last4, network: _network);
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add Card',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary)),
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
            CustomTextField(
              controller: _last4Controller,
              label: 'Last 4 Digits',
              icon: Icons.numbers,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppTheme.bgElevated,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _network,
                  isExpanded: true,
                  dropdownColor: AppTheme.bgElevated,
                  style: const TextStyle(color: AppTheme.textPrimary),
                  items: ['VISA', 'MASTERCARD', 'RUPAY'].map((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _network = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 32),
            GradientButton(
              text: 'Add Card',
              isLoading: _isLoading,
              onPressed: _handleAdd,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
