class User {
  final String id;
  final String? phone;
  final String email;
  final String name;
  final String? googleId;
  final String? avatar;
  final String kycStatus;
  final String? aadharUrl;
  final String? panUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    this.phone,
    required this.email,
    required this.name,
    this.googleId,
    this.avatar,
    this.kycStatus = 'UNSUBMITTED',
    this.aadharUrl,
    this.panUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String,
      name: json['name'] as String,
      googleId: json['googleId'] as String?,
      avatar: json['avatar'] as String?,
      kycStatus: json['kycStatus'] as String? ?? 'UNSUBMITTED',
      aadharUrl: json['aadharUrl'] as String?,
      panUrl: json['panUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// Returns initials for avatar display (up to 2 chars).
  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length.clamp(1, 2)).toUpperCase();
  }
}
