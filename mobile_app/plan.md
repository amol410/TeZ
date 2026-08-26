# TezSend Mobile App — Implementation Plan & Progress

## Project Location
`/Users/cms/Desktop/Code/mern/TezSend/mobile_app/`

> ⚠️ **DO NOT touch** `web/` or `backend/` — they are deployed.

---

## Backend API Reference (read-only)

Base URL logic (already in api_service.dart):
- Android emulator → `http://10.0.2.2:3000/api`
- iOS/Web → `http://localhost:3000/api`

| Method | Endpoint | Auth? | Notes |
|--------|----------|-------|-------|
| POST | `/auth/login` | ✗ | body: `{email, password}` → `{token, user}` |
| GET | `/auth/me` | ✓ | → user object |
| GET | `/transactions/history` | ✓ | → `Transaction[]` with nested `beneficiary` |
| GET | `/transactions/summary` | ✓ | → `{totalVolume: number}` |
| POST | `/transactions/initiate` | ✓ | body: `{beneficiaryId, amount}` → `{transactionId, airpayOrderId, totalAmount}` |
| GET | `/beneficiaries` | ✓ | → `Beneficiary[]` |
| POST | `/beneficiaries` | ✓ | body: `{type, upiId?, accountNo?, ifsc?, bankName?}` |
| GET | `/cards` | ✓ | → `Card[]` |
| POST | `/cards` | ✓ | body: `{token, last4, network}` |

Auth header: `Authorization: Bearer <token>` (token stored in SharedPreferences key `'token'`)

User model fields: `id, phone, email, name, googleId, avatar, createdAt, updatedAt`
Transaction fields: `id, userId, beneficiaryId, amount, convenienceFee, totalAmount, status (PENDING/COMPLETED/FAILED), airpayOrderId, createdAt, updatedAt, beneficiary: {id, type, upiId, accountNo, ifsc, bankName}`
Card fields: `id, userId, token, last4, network, createdAt`
Beneficiary fields: `id, userId, type, upiId, accountNo, ifsc, bankName, createdAt`

---

## ✅ COMPLETED

### Fixes (from error check session)
- Fixed `radialGradient` → `gradient` in `login_screen.dart` (compile error)
- Removed unused `api_service.dart` import from `login_screen.dart`
- Replaced all deprecated `.withOpacity()` → `.withValues(alpha:)` across all files
- Fixed deprecated `ColorScheme.background` → removed (already set via `scaffoldBackgroundColor`)
- `flutter analyze` → **No issues found**

### Models Created
- ✅ `lib/models/user_model.dart` — typed User with `.initials` getter
- ✅ `lib/models/beneficiary_model.dart` — typed Beneficiary with `.displayName` getter
- ✅ `lib/models/card_model.dart` — typed AppCard (named AppCard to avoid SDK conflict)
- ✅ `lib/models/transaction_model.dart` — typed AppTransaction with nested Beneficiary

### Services Created/Updated
- ✅ `lib/services/user_session.dart` — singleton with `setUser()`, `logout()`, `tryRestore()`
- ✅ `lib/services/api_service.dart` — fully rewritten with all endpoints:
  - `login()`, `getMe()`
  - `getTransactionHistory()`, `getTransactionSummary()`, `initiateTransaction()`
  - `getCards()`, `addCard()`
  - `getBeneficiaries()`, `addBeneficiary()`

### Screens Updated
- ✅ `lib/screens/login_screen.dart` — real API call, stores token + user in session, error display with icon

---

## ❌ REMAINING (do these next)

### 1. Update `lib/screens/dashboard_screen.dart`
Convert to `StatefulWidget`. Fetch real data on `initState`:
```dart
// imports needed:
import '../services/api_service.dart';
import '../services/user_session.dart';
import '../models/transaction_model.dart';
import 'send_money_screen.dart';

// State variables:
List<AppTransaction> _transactions = [];
double _totalVolume = 0;
bool _isLoading = true;

// initState → fetch:
ApiService.getTransactionHistory() → show last 3
ApiService.getTransactionSummary() → _totalVolume

// Header: use UserSession.instance.currentUser?.name ?? 'User'
// Header initials: UserSession.instance.currentUser?.initials ?? 'U'
// Balance card: show _totalVolume formatted as currency
// 'Send' quick action → Navigator.push(SendMoneyScreen())
// Add RefreshIndicator wrapper
```

### 2. Create `lib/screens/transactions_screen.dart`
Full transaction history:
```dart
// StatefulWidget
// Fetch: ApiService.getTransactionHistory()
// Group by date (compare createdAt.day)
// For each tx: show amount, status badge, beneficiary.displayName or airpayOrderId
// Status colors: PENDING=brand, COMPLETED=green, FAILED=red
// Pull-to-refresh with RefreshIndicator
// Empty state: Icon(Icons.receipt_long_outlined) + "No transactions yet"
```

### 3. Create `lib/screens/cards_screen.dart`
```dart
// StatefulWidget
// Fetch: ApiService.getCards()
// Show each card as a gradient Container (110h) with:
//   - network name top-right
//   - "•••• •••• •••• last4" center
//   - createdAt bottom
// FloatingActionButton → _showAddCardSheet()
// Bottom sheet form: last4 (4 digits), network dropdown [VISA, MASTERCARD, RUPAY]
//   token = 'tok_${DateTime.now().millisecondsSinceEpoch}' (mock)
// ApiService.addCard() → reload list
// Empty state: Icon(Icons.credit_card_outlined) + "No cards added yet"
```

### 4. Create `lib/screens/profile_screen.dart`
```dart
// StatelessWidget (reads from UserSession)
// Top section: avatar circle with initials (same style as dashboard header, but 72x72)
// User name (bold, 20px) + email + phone (if not null)
// List tiles: Account Details (info only), Beneficiaries (navigate to beneficiaries list), Help & Support
// Logout button (red, full-width) → UserSession.instance.logout() → Navigator.pushAndRemoveUntil(LoginScreen)
```

### 5. Create `lib/screens/send_money_screen.dart`
Two-step flow:
```dart
// Step 1: Pick Beneficiary
//   Fetch ApiService.getBeneficiaries()
//   ListView of beneficiaries with displayName
//   "Add New" button → _showAddBeneficiarySheet() (type: UPI or BANK, fields accordingly)
//   Tap a beneficiary → go to step 2

// Step 2: Enter Amount  
//   TextField for amount (numeric)
//   Show fee: amount * 0.02
//   Show total: amount + fee
//   Confirm button → ApiService.initiateTransaction(beneficiaryId, amount)
//   On success: show AlertDialog with success message → pop back to dashboard
//   On error: show error SnackBar
```

### 6. Update `lib/screens/main_navigation.dart`
Replace the 3 placeholder `Text()` widgets:
```dart
// Remove: const Center(child: Text('Transactions', ...))
// Add: const TransactionsScreen()

// Remove: const Center(child: Text('Cards', ...))  
// Add: const CardsScreen()

// Remove: const Center(child: Text('Profile', ...))
// Add: const ProfileScreen()

// Add imports:
import 'transactions_screen.dart';
import 'cards_screen.dart';
import 'profile_screen.dart';
```

### 7. Update `lib/widgets/custom_widgets.dart`
Add `keyboardType` parameter to `CustomTextField`:
```dart
final TextInputType? keyboardType;
// In constructor: this.keyboardType,
// In TextField: keyboardType: keyboardType,
```
(login_screen.dart already passes `keyboardType: TextInputType.emailAddress`)

### 8. Final verification
```bash
cd /Users/cms/Desktop/Code/mern/TezSend/mobile_app
flutter analyze
```
Should return: **No issues found.**

---

## File Tree After Completion

```
mobile_app/lib/
├── main.dart                          ✅ (no changes needed)
├── models/
│   ├── user_model.dart                ✅ DONE
│   ├── transaction_model.dart         ✅ DONE
│   ├── card_model.dart                ✅ DONE
│   └── beneficiary_model.dart         ✅ DONE
├── services/
│   ├── api_service.dart               ✅ DONE
│   └── user_session.dart              ✅ DONE
├── theme/
│   └── app_theme.dart                 ✅ DONE (fixes applied)
├── widgets/
│   └── custom_widgets.dart            ❌ needs keyboardType param added
└── screens/
    ├── login_screen.dart              ✅ DONE
    ├── dashboard_screen.dart          ❌ needs rewrite to StatefulWidget
    ├── main_navigation.dart           ❌ needs real screens wired
    ├── transactions_screen.dart       ❌ CREATE NEW
    ├── cards_screen.dart              ❌ CREATE NEW
    ├── profile_screen.dart            ❌ CREATE NEW
    └── send_money_screen.dart         ❌ CREATE NEW
```

---

## Design Guidelines (match existing theme)
- Colors: `AppTheme.bgBase`, `AppTheme.bgSurface`, `AppTheme.bgElevated`, `AppTheme.brand`, `AppTheme.green`, `AppTheme.red`, `AppTheme.textPrimary`, `AppTheme.textSecondary`
- Gradients: `AppTheme.primaryGradient` (brand → purple)
- Card border radius: 14–20px
- Use `.withValues(alpha: x)` NOT `.withOpacity(x)`
- Reuse `GlassCard`, `GradientButton`, `CustomTextField` from custom_widgets.dart
- All screens: dark theme, no AppBar (use SafeArea + custom header)
