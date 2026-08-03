#!/bin/bash
BASE_URL="http://localhost:3000"

echo "1. Health Check"
curl -s $BASE_URL/health | jq .
echo ""

echo "2. Register"
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register -H "Content-Type: application/json" -d '{"phone": "1234567890", "email": "test@test.com", "name": "Test User"}')
echo $RESPONSE | jq .
TOKEN=$(echo $RESPONSE | jq -r .token)
echo ""

echo "3. Login"
curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"phone": "1234567890"}' | jq .
echo ""

echo "4. Add Card"
curl -s -X POST $BASE_URL/api/cards -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"token": "mock-token", "last4": "1234", "network": "Visa"}' | jq .
echo ""

echo "5. Get Cards"
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/cards | jq .
echo ""

echo "6. Add Beneficiary"
BEN_RESPONSE=$(curl -s -X POST $BASE_URL/api/beneficiaries -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"type": "UPI", "upiId": "test@upi"}')
echo $BEN_RESPONSE | jq .
BEN_ID=$(echo $BEN_RESPONSE | jq -r .id)
echo ""

echo "7. Get Beneficiaries"
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/beneficiaries | jq .
echo ""

echo "8. Calculate Fee"
curl -s -X POST $BASE_URL/api/transactions/calculate-fee -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"amount": 1000}' | jq .
echo ""

echo "9. Initiate Transaction"
curl -s -X POST $BASE_URL/api/transactions/initiate -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"beneficiaryId": "'$BEN_ID'", "amount": 1000}' | jq .
echo ""

echo "10. Transaction History"
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/api/transactions/history | jq .
echo ""
