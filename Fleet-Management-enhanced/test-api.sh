#!/bin/bash
# Test Script for Fleet Management API

echo "🧪 Fleet Management API - Test Suite"
echo "===================================="
echo ""

BASE_URL="http://localhost:5000"
TESTS_PASSED=0
TESTS_FAILED=0

# Test colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo "Test 1: Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Health check returned 200"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Health check returned $HTTP_CODE"
    ((TESTS_FAILED++))
fi
echo ""

# Test 2: Get Vehicles Endpoint
echo "Test 2: Get Vehicles Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/vehicles")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Vehicles endpoint returned 200"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Vehicles endpoint returned $HTTP_CODE"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: Invalid Endpoint
echo "Test 3: Invalid Endpoint Handling"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invalid")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "500" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Invalid endpoint properly handled"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Unexpected response code: $HTTP_CODE"
fi
echo ""

# Test 4: Check Server Response Time
echo "Test 4: Server Response Time"
START=$(date +%s%N)
curl -s "$BASE_URL/" > /dev/null
END=$(date +%s%N)
ELAPSED=$((($END - $START) / 1000000))
if [ "$ELAPSED" -lt 1000 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Response time: ${ELAPSED}ms"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - Slow response: ${ELAPSED}ms"
fi
echo ""

# Test 5: Multiple Requests (Load Test)
echo "Test 5: Multiple Requests (10 requests)"
FAILED_REQUESTS=0
for i in {1..10}; do
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/vehicles")
    if [ "$HTTP_CODE" != "200" ]; then
        ((FAILED_REQUESTS++))
    fi
done
if [ "$FAILED_REQUESTS" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} - All 10 requests succeeded"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - $FAILED_REQUESTS requests failed"
    ((TESTS_FAILED++))
fi
echo ""

# Test Results Summary
echo "===================================="
echo "Test Results Summary"
echo "===================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
else
    echo -e "Tests Failed: ${GREEN}0${NC}"
fi
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
