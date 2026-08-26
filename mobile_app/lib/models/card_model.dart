class AppCard {
  final String id;
  final String userId;
  final String token;
  final String last4;
  final String network; // e.g. 'VISA', 'MASTERCARD'
  final DateTime createdAt;

  const AppCard({
    required this.id,
    required this.userId,
    required this.token,
    required this.last4,
    required this.network,
    required this.createdAt,
  });

  factory AppCard.fromJson(Map<String, dynamic> json) {
    return AppCard(
      id: json['id'] as String,
      userId: json['userId'] as String,
      token: json['token'] as String,
      last4: json['last4'] as String,
      network: json['network'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
