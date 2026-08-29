import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/user_model.dart';
import '../models/transaction_model.dart';
import '../models/card_model.dart';
import '../models/beneficiary_model.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator to access host's localhost
  // Use localhost for iOS simulator or web
  static String get baseUrl {
    // Connect directly to the production backend
    return 'https://tezsend.com/api';
  }

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<void> setAuthToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  /// POST /auth/login → { token, user }
  static Future<Map<String, dynamic>> login(
      String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw Exception(body['message'] ?? 'Login failed');
    }
    return body;
  }

  /// POST /auth/register → { token, user }
  static Future<Map<String, dynamic>> register(
      String name, String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/register');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception(body['message'] ?? 'Registration failed');
    }
    return body;
  }

  /// POST /auth/google → { token, user }
  static Future<Map<String, dynamic>> loginWithGoogle(String idToken) async {
    final url = Uri.parse('$baseUrl/auth/google');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'idToken': idToken}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception(body['message'] ?? 'Google Login failed');
    }
    return body;
  }

  /// GET /auth/me → User
  static Future<User> getMe() async {
    final url = Uri.parse('$baseUrl/auth/me');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode != 200) throw Exception('Failed to fetch user');
    return User.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  // ─── KYC ─────────────────────────────────────────────────────────────────────

  /// POST /auth/kyc → { message, user }
  static Future<User> submitKYC(String aadharPath, String panPath) async {
    final url = Uri.parse('$baseUrl/auth/kyc');
    final request = http.MultipartRequest('POST', url);
    
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    request.files.add(await http.MultipartFile.fromPath('aadhar', aadharPath));
    request.files.add(await http.MultipartFile.fromPath('pan', panPath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    
    if (response.statusCode != 200) {
      throw Exception(body['message'] ?? 'KYC submission failed');
    }
    return User.fromJson(body['user'] as Map<String, dynamic>);
  }

  // ─── Transactions ─────────────────────────────────────────────────────────────

  /// GET /transactions/history → List<AppTransaction>
  static Future<List<AppTransaction>> getTransactionHistory() async {
    final url = Uri.parse('$baseUrl/transactions/history');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode != 200) {
      throw Exception('Failed to load transactions');
    }
    final list = jsonDecode(response.body) as List<dynamic>;
    return list
        .map((e) => AppTransaction.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /transactions/summary → { totalVolume: double }
  static Future<double> getTransactionSummary() async {
    final url = Uri.parse('$baseUrl/transactions/summary');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode != 200) throw Exception('Failed to load summary');
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return (body['totalVolume'] as num).toDouble();
  }

  /// POST /transactions/initiate → { transactionId, airpayOrderId, totalAmount }
  static Future<Map<String, dynamic>> initiateTransaction(
      String beneficiaryId, double amount) async {
    final url = Uri.parse('$baseUrl/transactions/initiate');
    final response = await http.post(
      url,
      headers: await _getHeaders(),
      body: jsonEncode({'beneficiaryId': beneficiaryId, 'amount': amount}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw Exception(body['message'] ?? 'Transaction failed');
    }
    return body;
  }

  // ─── Cards ────────────────────────────────────────────────────────────────────

  /// GET /cards → List<AppCard>
  static Future<List<AppCard>> getCards() async {
    final url = Uri.parse('$baseUrl/cards');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode != 200) throw Exception('Failed to load cards');
    final list = jsonDecode(response.body) as List<dynamic>;
    return list
        .map((e) => AppCard.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /cards → AppCard
  static Future<AppCard> addCard(
      {required String token,
      required String last4,
      required String network}) async {
    final url = Uri.parse('$baseUrl/cards');
    final response = await http.post(
      url,
      headers: await _getHeaders(),
      body: jsonEncode({'token': token, 'last4': last4, 'network': network}),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw Exception(body['message'] ?? 'Failed to add card');
    }
    return AppCard.fromJson(body);
  }

  // ─── Beneficiaries ────────────────────────────────────────────────────────────

  /// GET /beneficiaries → List<Beneficiary>
  static Future<List<Beneficiary>> getBeneficiaries() async {
    final url = Uri.parse('$baseUrl/beneficiaries');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode != 200) {
      throw Exception('Failed to load beneficiaries');
    }
    final list = jsonDecode(response.body) as List<dynamic>;
    return list
        .map((e) => Beneficiary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /beneficiaries → Beneficiary
  static Future<Beneficiary> addBeneficiary({
    required String type,
    String? upiId,
    String? accountNo,
    String? ifsc,
    String? bankName,
  }) async {
    final url = Uri.parse('$baseUrl/beneficiaries');
    final response = await http.post(
      url,
      headers: await _getHeaders(),
      body: jsonEncode({
        'type': type,
        if (upiId != null) 'upiId': upiId,
        if (accountNo != null) 'accountNo': accountNo,
        if (ifsc != null) 'ifsc': ifsc,
        if (bankName != null) 'bankName': bankName,
      }),
    );
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode != 200) {
      throw Exception(body['message'] ?? 'Failed to add beneficiary');
    }
    return Beneficiary.fromJson(body);
  }
}
