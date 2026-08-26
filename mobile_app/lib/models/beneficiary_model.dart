class Beneficiary {
  final String id;
  final String userId;
  final String type; // 'UPI' | 'BANK'
  final String? upiId;
  final String? accountNo;
  final String? ifsc;
  final String? bankName;
  final DateTime createdAt;

  const Beneficiary({
    required this.id,
    required this.userId,
    required this.type,
    this.upiId,
    this.accountNo,
    this.ifsc,
    this.bankName,
    required this.createdAt,
  });

  factory Beneficiary.fromJson(Map<String, dynamic> json) {
    return Beneficiary(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: json['type'] as String,
      upiId: json['upiId'] as String?,
      accountNo: json['accountNo'] as String?,
      ifsc: json['ifsc'] as String?,
      bankName: json['bankName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// Human-readable display label for this beneficiary.
  String get displayName {
    if (type == 'UPI' && upiId != null) return upiId!;
    if (bankName != null && accountNo != null) {
      return '$bankName ••${accountNo!.substring(accountNo!.length - 4)}';
    }
    return accountNo ?? upiId ?? 'Unknown';
  }
}
