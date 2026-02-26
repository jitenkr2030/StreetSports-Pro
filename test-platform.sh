#!/bin/bash

# StreetSports Pro - Comprehensive Platform Testing Script
# This script tests all major features and functions of the platform

echo "🏆 StreetSports Pro - Platform Testing Suite"
echo "=========================================="
echo ""

# Configuration
BASE_URL="http://localhost:3000/api"
TEST_RESULTS=()

# Helper function to test API endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo "🔍 Testing: $description"
    echo "   Endpoint: $endpoint"
    
    response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint")
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo "   ✅ PASSED (Status: $status_code)"
        TEST_RESULTS+=("✅ $description")
        
        # Show sample response
        echo "   📄 Sample Response:"
        echo "$response_body" | head -3 | sed 's/^/      /'
    else
        echo "   ❌ FAILED (Status: $status_code, Expected: $expected_status)"
        TEST_RESULTS+=("❌ $description")
        echo "   📄 Error Response:"
        echo "$response_body" | head -3 | sed 's/^/      /'
    fi
    echo ""
}

# Helper function to test POST endpoint
test_post_endpoint() {
    local endpoint=$1
    local description=$2
    local data=$3
    local expected_status=${4:-201}
    
    echo "🔍 Testing: $description"
    echo "   Endpoint: $endpoint"
    echo "   Data: $data"
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$BASE_URL$endpoint")
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo "   ✅ PASSED (Status: $status_code)"
        TEST_RESULTS+=("✅ $description")
        echo "   📄 Response:"
        echo "$response_body" | head -3 | sed 's/^/      /'
    else
        echo "   ❌ FAILED (Status: $status_code, Expected: $expected_status)"
        TEST_RESULTS+=("❌ $description")
        echo "   📄 Error Response:"
        echo "$response_body" | head -3 | sed 's/^/      /'
    fi
    echo ""
}

echo "📊 Testing Core Platform Features"
echo "==============================="

# Test 1: Sports API
test_endpoint "/sports" "Get all available sports"

# Test 2: Teams API
test_endpoint "/teams" "Get all teams"

# Test 3: Teams API with sport filter
test_endpoint "/teams?sport=Cricket" "Get cricket teams only"

# Test 4: Matches API
test_endpoint "/matches" "Get all matches"

# Test 5: Matches API with sport filter
test_endpoint "/matches?sport=Football" "Get football matches only"

# Test 6: Tournaments API
test_endpoint "/tournaments" "Get all tournaments"

# Test 7: Grounds API
test_endpoint "/grounds" "Get all venues"

# Test 8: Grounds API with sport filter
test_endpoint "/grounds?sport=Badminton" "Get badminton venues only"

# Test 9: Players API
test_endpoint "/players" "Get all players"

# Test 10: Rankings API
test_endpoint "/rankings/players" "Get player rankings"

echo "🏟️ Testing Multi-Sport Functionality"
echo "===================================="

# Test 11: Cricket-specific data
test_endpoint "/teams?sport=Cricket&limit=5" "Get cricket teams with pagination"

# Test 12: Football-specific data
test_endpoint "/teams?sport=Football&limit=5" "Get football teams with pagination"

# Test 13: Badminton-specific data
test_endpoint "/teams?sport=Badminton&limit=5" "Get badminton teams with pagination"

# Test 14: Volleyball-specific data
test_endpoint "/teams?sport=Volleyball&limit=5" "Get volleyball teams with pagination"

# Test 15: Area-based filtering
test_endpoint "/teams?area=Janakpuri" "Get teams from Janakpuri area"

echo "💰 Testing Financial Features"
echo "==========================="

# Test 16: Payments API
test_endpoint "/payments" "Get payment records"

# Test 17: Ground Bookings API
test_endpoint "/ground-bookings" "Get ground booking records"

echo "🎮 Testing Advanced Features"
echo "==========================="

# Test 18: Scoring API
test_endpoint "/scoring" "Get scoring data"

# Test 19: Media Upload API
test_endpoint "/media/upload" "Get media upload endpoint"

# Test 20: Disputes API
test_endpoint "/disputes" "Get dispute records"

# Test 21: Awards API
test_endpoint "/awards" "Get awards data"

echo "🔧 Testing Admin Features"
echo "========================="

# Test 22: Admin Analytics
test_endpoint "/admin/analytics" "Get admin analytics"

echo "📝 Testing Data Validation"
echo "========================="

# Test 23: Invalid sport filter
test_endpoint "/teams?sport=InvalidSport" "Test invalid sport filter" 400

# Test 24: Invalid pagination
test_endpoint "/teams?limit=1000" "Test invalid pagination" 400

echo "🏆 Testing Challenge System"
echo "==========================="

# Test 25: Create a new challenge (test data)
challenge_data='{
  "challengingTeamId": "test-team-id",
  "message": "Test challenge for validation",
  "proposedFormat": "T20",
  "status": "PENDING"
}'
test_post_endpoint "/challenges" "Create new challenge" "$challenge_data" 400

echo "📊 Test Results Summary"
echo "======================"
echo ""

passed=0
failed=0

for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == ✅* ]]; then
        ((passed++))
        echo "$result"
    else
        ((failed++))
        echo "$result"
    fi
done

echo ""
echo "📈 Test Statistics:"
echo "   Total Tests: ${#TEST_RESULTS[@]}"
echo "   ✅ Passed: $passed"
echo "   ❌ Failed: $failed"
echo "   📊 Success Rate: $(( passed * 100 / ${#TEST_RESULTS[@]} ))%"

if [ $failed -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed! StreetSports Pro platform is working correctly."
    echo "🚀 Ready for production deployment."
else
    echo ""
    echo "⚠️  Some tests failed. Please review the failed tests above."
    echo "🔧 Fix the issues before proceeding to production."
fi

echo ""
echo "🏆 StreetSports Pro - Platform Testing Complete!"
echo "============================================="