import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_widgets.dart';
import '../services/api_service.dart';
import '../services/user_session.dart';

class KYCScreen extends StatefulWidget {
  const KYCScreen({super.key});

  @override
  State<KYCScreen> createState() => _KYCScreenState();
}

class _KYCScreenState extends State<KYCScreen> {
  File? _aadharFile;
  File? _panFile;
  bool _isLoading = false;

  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(bool isAadhar) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        if (isAadhar) {
          _aadharFile = File(image.path);
        } else {
          _panFile = File(image.path);
        }
      });
    }
  }

  Future<void> _submit() async {
    if (_aadharFile == null || _panFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload both Aadhar and PAN card images')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final user = await ApiService.submitKYC(_aadharFile!.path, _panFile!.path);
      UserSession.instance.setUser(user);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('KYC Submitted Successfully!', style: TextStyle(color: Colors.white)),
          backgroundColor: AppTheme.green,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', ''), style: const TextStyle(color: Colors.white)),
          backgroundColor: AppTheme.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildUploadButton(String title, File? file, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 120,
        width: double.infinity,
        decoration: BoxDecoration(
          color: AppTheme.bgElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: file != null ? AppTheme.emerald : Colors.white.withOpacity(0.1)),
        ),
        child: file != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.file(file, fit: BoxFit.cover),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cloud_upload_outlined, color: AppTheme.textMuted, size: 32),
                  const SizedBox(height: 8),
                  Text(title, style: const TextStyle(color: AppTheme.textSecondary)),
                ],
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete KYC', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('To comply with regulations, we require photos of your Aadhar and PAN cards.', style: TextStyle(color: AppTheme.textSecondary)),
              const SizedBox(height: 32),
              
              const Text('Aadhar Card', style: TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _buildUploadButton('Tap to upload Aadhar', _aadharFile, () => _pickImage(true)),
              
              const SizedBox(height: 24),
              
              const Text('PAN Card', style: TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _buildUploadButton('Tap to upload PAN', _panFile, () => _pickImage(false)),
              
              const Spacer(),
              GradientButton(
                text: 'Submit for Verification',
                isLoading: _isLoading,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
