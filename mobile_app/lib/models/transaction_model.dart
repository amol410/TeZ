import 'beneficiary_model.dart';

class AppTransaction {
  final String id;
  final String userId;
  final String? beneficiaryId;
  final double amount;
  final double convenienceFee;
  final double totalAmount;
  final String status; // 'PENDING' | 'COMPLETED' | 'FAILED'
  final String? airpayOrderId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Beneficiary? beneficiary;

  const AppTransaction({
    required this.id,
    required this.userId,
    this.beneficiaryId,
    required this.amount,
    required this.convenienceFee,
    required this.totalAmount,
    required this.status,
    this.airpayOrderId,
    required this.createdAt,
    required this.updatedAt,
    this.beneficiary,
  });

  factory AppTransaction.fromJson(Map<String, dynamic> json) {
    return AppTransaction(
      id: json['id'] as String,
      userId: json['userId'] as String,
      beneficiaryId: json['beneficiaryId'] as String?,
      amount: (json['amount'] as num).toDouble(),
      convenienceFee: (json['convenienceFee'] as num).toDouble(),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      status: json['status'] as String,
      airpayOrderId: json['airpayOrderId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      beneficiary: json['beneficiary'] != null
          ? Beneficiary.fromJson({
              ...json['beneficiary'] as Map<String, dynamic>,
              // beneficiary nested in history doesn't have userId; fill it
              'userId': json['userId'] as String,
            })
          : null,
    );
  }

  bool get isCredit => status == 'COMPLETED' && amount < 0;
  bool get isPending => status == 'PENDING';
  bool get isFailed => status == 'FAILED';
}
