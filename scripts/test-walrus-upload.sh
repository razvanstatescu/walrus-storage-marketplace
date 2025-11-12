#!/bin/bash

# Walrus Storage Marketplace Testing Script
# Upload test files to Walrus with configurable parameters

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
PUBLISHER_URL="http://walrus-publisher-testnet.cetus.zone:9001"
RECIPIENT_WALLET="0xedbab07ff09790b85c17c694f0799998f12ce27a6000808864f36e08c27bf6c2"
DEFAULT_WORDS=100
DEFAULT_EPOCHS=5

# Parse command line arguments
NUM_WORDS=${1:-$DEFAULT_WORDS}
NUM_EPOCHS=${2:-$DEFAULT_EPOCHS}

# Validate inputs
if ! [[ "$NUM_WORDS" =~ ^[0-9]+$ ]] || [ "$NUM_WORDS" -lt 1 ]; then
    echo -e "${RED}Error: Number of words must be a positive integer${NC}"
    exit 1
fi

if ! [[ "$NUM_EPOCHS" =~ ^[0-9]+$ ]] || [ "$NUM_EPOCHS" -lt 1 ]; then
    echo -e "${RED}Error: Number of epochs must be a positive integer${NC}"
    exit 1
fi

# Check for required dependencies
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is required but not installed${NC}"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is required but not installed. Install with: brew install jq${NC}"; exit 1; }

# Print configuration
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Walrus Storage Upload Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Words in test file: ${GREEN}$NUM_WORDS${NC}"
echo -e "  Storage epochs: ${GREEN}$NUM_EPOCHS${NC}"
echo -e "  Recipient wallet: ${GREEN}$RECIPIENT_WALLET${NC}"
echo -e "  Publisher URL: ${GREEN}$PUBLISHER_URL${NC}"
echo ""

# Generate random test data
echo -e "${YELLOW}Generating test data...${NC}"

# Create a temporary file
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Generate random words (using Lorem Ipsum style text)
WORDS=("lorem" "ipsum" "dolor" "sit" "amet" "consectetur" "adipiscing" "elit"
       "sed" "do" "eiusmod" "tempor" "incididunt" "ut" "labore" "et" "dolore"
       "magna" "aliqua" "enim" "ad" "minim" "veniam" "quis" "nostrud"
       "exercitation" "ullamco" "laboris" "nisi" "aliquip" "ex" "ea" "commodo"
       "consequat" "duis" "aute" "irure" "in" "reprehenderit" "voluptate"
       "velit" "esse" "cillum" "fugiat" "nulla" "pariatur" "excepteur" "sint"
       "occaecat" "cupidatat" "non" "proident" "sunt" "culpa" "qui" "officia"
       "deserunt" "mollit" "anim" "id" "est" "laborum")

# Generate text with specified number of words
for ((i=1; i<=NUM_WORDS; i++)); do
    # Pick a random word
    RANDOM_WORD=${WORDS[$RANDOM % ${#WORDS[@]}]}
    echo -n "$RANDOM_WORD " >> "$TEMP_FILE"

    # Add newline every 15 words for readability
    if [ $((i % 15)) -eq 0 ]; then
        echo "" >> "$TEMP_FILE"
    fi
done

# Get file size
FILE_SIZE=$(wc -c < "$TEMP_FILE" | tr -d ' ')
echo -e "${GREEN}✓${NC} Generated test file: ${FILE_SIZE} bytes"
echo ""

# Upload to Walrus
echo -e "${YELLOW}Uploading to Walrus...${NC}"
UPLOAD_URL="${PUBLISHER_URL}/v1/blobs?epochs=${NUM_EPOCHS}"

# Add send_object_to parameter if recipient wallet is set
if [ ! -z "$RECIPIENT_WALLET" ]; then
    UPLOAD_URL="${UPLOAD_URL}&send_object_to=${RECIPIENT_WALLET}"
    echo -e "  Blob object will be sent to: ${GREEN}${RECIPIENT_WALLET}${NC}"
fi

echo -e "  Upload URL: ${BLUE}${UPLOAD_URL}${NC}"
echo ""

# Perform the upload with verbose output
HTTP_CODE=$(curl -s -w "%{http_code}" -X PUT "$UPLOAD_URL" \
    --upload-file "$TEMP_FILE" \
    -H "Content-Type: application/octet-stream" \
    -o /tmp/walrus_response.txt)

# Read the response
RESPONSE=$(cat /tmp/walrus_response.txt)
rm -f /tmp/walrus_response.txt

# Check HTTP status code
if [ "$HTTP_CODE" -ne 200 ] && [ "$HTTP_CODE" -ne 201 ]; then
    echo -e "${RED}✗ Upload failed with HTTP status code: ${HTTP_CODE}${NC}"
    echo -e "${YELLOW}Response:${NC}"
    echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓${NC} Upload successful (HTTP $HTTP_CODE)"
echo ""

# Always print raw response first for debugging
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Raw API Response${NC}"
echo -e "${BLUE}========================================${NC}"
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Upload Results${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if response contains newlyCreated or alreadyCertified
if echo "$RESPONSE" | jq -e '.newlyCreated' > /dev/null 2>&1; then
    BLOB_OBJECT=$(echo "$RESPONSE" | jq -r '.newlyCreated.blobObject')
    BLOB_ID=$(echo "$RESPONSE" | jq -r '.newlyCreated.blobObject.blobId')
    ENCODED_SIZE=$(echo "$RESPONSE" | jq -r '.newlyCreated.blobObject.storage.storageSize')
    START_EPOCH=$(echo "$RESPONSE" | jq -r '.newlyCreated.blobObject.storage.startEpoch')
    END_EPOCH=$(echo "$RESPONSE" | jq -r '.newlyCreated.blobObject.storage.endEpoch')
    COST=$(echo "$RESPONSE" | jq -r '.newlyCreated.cost')

    echo -e "${GREEN}Status: Newly Created${NC}"
    echo ""
elif echo "$RESPONSE" | jq -e '.alreadyCertified' > /dev/null 2>&1; then
    BLOB_OBJECT=$(echo "$RESPONSE" | jq -r '.alreadyCertified.blobObject')
    BLOB_ID=$(echo "$RESPONSE" | jq -r '.alreadyCertified.blobObject.blobId')
    ENCODED_SIZE=$(echo "$RESPONSE" | jq -r '.alreadyCertified.blobObject.storage.storageSize')
    START_EPOCH=$(echo "$RESPONSE" | jq -r '.alreadyCertified.blobObject.storage.startEpoch')
    END_EPOCH=$(echo "$RESPONSE" | jq -r '.alreadyCertified.blobObject.storage.endEpoch')
    EVENT_OR_OBJECT=$(echo "$RESPONSE" | jq -r '.alreadyCertified.eventOrObject')

    echo -e "${YELLOW}Status: Already Certified (blob already exists)${NC}"
    echo -e "Event/Object: ${BLUE}${EVENT_OR_OBJECT}${NC}"
    echo ""
else
    echo -e "${RED}Error: Unexpected response format${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

# Display blob information
echo -e "${YELLOW}Blob Information:${NC}"
echo -e "  Blob ID: ${GREEN}${BLOB_ID}${NC}"
echo -e "  File Size: ${GREEN}${FILE_SIZE}${NC} bytes"
echo -e "  Encoded Size: ${GREEN}${ENCODED_SIZE}${NC} bytes"
echo -e "  Storage Epochs: ${GREEN}${START_EPOCH} → ${END_EPOCH}${NC} (duration: $((END_EPOCH - START_EPOCH)) epochs)"

if [ ! -z "$COST" ] && [ "$COST" != "null" ]; then
    COST_WAL=$(echo "scale=4; $COST / 1000000000" | bc)
    echo -e "  Cost: ${GREEN}${COST}${NC} MIST (${COST_WAL} WAL)"
fi

echo ""

# Display blob object information if available
if [ ! -z "$BLOB_OBJECT" ] && [ "$BLOB_OBJECT" != "null" ]; then
    OBJECT_ID=$(echo "$BLOB_OBJECT" | jq -r '.id')
    if [ ! -z "$OBJECT_ID" ] && [ "$OBJECT_ID" != "null" ]; then
        echo -e "${YELLOW}Blob Object:${NC}"
        echo -e "  Object ID: ${GREEN}${OBJECT_ID}${NC}"
        echo -e "  Owner: ${GREEN}${RECIPIENT_WALLET}${NC}"
        echo ""
    fi
fi

# Display explorer links
echo -e "${YELLOW}Explorer Links:${NC}"
echo -e "  Walrus Blob: ${BLUE}https://aggregator.walrus-testnet.walrus.space/v1/${BLOB_ID}${NC}"

if [ ! -z "$OBJECT_ID" ] && [ "$OBJECT_ID" != "null" ]; then
    echo -e "  Sui Object: ${BLUE}https://suiscan.xyz/testnet/object/${OBJECT_ID}${NC}"
fi

echo ""
echo -e "${GREEN}✓ Test completed successfully!${NC}"
echo ""
