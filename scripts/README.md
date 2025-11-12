# Walrus Storage Marketplace Testing Scripts

This directory contains scripts to help test the Walrus storage marketplace.

## Prerequisites

Before running the scripts, ensure you have the following installed:

- **curl** - Should be pre-installed on macOS
- **jq** - JSON parser for command line
  ```bash
  brew install jq
  ```
- **bc** - Calculator for floating point arithmetic (usually pre-installed on macOS)

## test-walrus-upload.sh

A bash script to upload test files to Walrus with configurable parameters.

### Usage

```bash
./scripts/test-walrus-upload.sh [NUM_WORDS] [NUM_EPOCHS]
```

### Parameters

- **NUM_WORDS** (optional, default: 100)
  - Number of words to generate in the test file
  - Example: 500 will create a ~2-3KB file

- **NUM_EPOCHS** (optional, default: 5)
  - Number of epochs to store the file on Walrus
  - Each epoch is approximately 24 hours on testnet

### Examples

**Upload a small test file (100 words, 5 epochs):**
```bash
./scripts/test-walrus-upload.sh
```

**Upload a medium test file (500 words, 10 epochs):**
```bash
./scripts/test-walrus-upload.sh 500 10
```

**Upload a large test file (5000 words, 100 epochs):**
```bash
./scripts/test-walrus-upload.sh 5000 100
```

### Configuration

The script uses the following default configuration:

- **Publisher URL**: `https://publisher.testnet.walrus.atalma.io`
- **Recipient Wallet**: `0xedbab07ff09790b85c17c694f0799998f12ce27a6000808864f36e08c27bf6c2`
- **Network**: Walrus Testnet

To modify these values, edit the variables at the top of the script:

```bash
PUBLISHER_URL="https://publisher.testnet.walrus.atalma.io"
RECIPIENT_WALLET="your_wallet_address_here"
```

### Output

The script provides detailed information about the upload:

- **File size** - Size of the generated test file in bytes
- **Blob ID** - Unique identifier for the blob on Walrus
- **Object ID** - Sui blockchain object ID (if blob object was created)
- **Encoded size** - Size after erasure coding
- **Storage epochs** - Start and end epochs for storage
- **Cost** - Upload cost in MIST and WAL tokens
- **Explorer links** - Direct links to view blob on Walrus and Sui explorers

### Example Output

```
========================================
  Walrus Storage Upload Test
========================================
Configuration:
  Words in test file: 500
  Storage epochs: 10
  Recipient wallet: 0xedbab...bf6c2
  Publisher URL: https://publisher.testnet.walrus.atalma.io

Generating test data...
✓ Generated test file: 2847 bytes

Uploading to Walrus...
  Blob object will be sent to: 0xedbab...bf6c2
  Upload URL: https://publisher.testnet.walrus.atalma.io/v1/blobs?epochs=10&send_object_to=0xedbab...bf6c2

✓ Upload successful!

========================================
  Upload Results
========================================
Status: Newly Created

Blob Information:
  Blob ID: ABC123...XYZ789
  File Size: 2847 bytes
  Encoded Size: 4096 bytes
  Storage Epochs: 100 → 110 (duration: 10 epochs)
  Cost: 5000000 MIST (0.0050 WAL)

Blob Object:
  Object ID: 0x123456...abcdef
  Owner: 0xedbab...bf6c2

Explorer Links:
  Walrus Blob: https://aggregator.walrus-testnet.walrus.space/v1/ABC123...XYZ789
  Sui Object: https://suiscan.xyz/testnet/object/0x123456...abcdef

✓ Test completed successfully!
```

### Debug Mode

To see the full JSON response from the Walrus publisher API, run with `DEBUG=1`:

```bash
DEBUG=1 ./scripts/test-walrus-upload.sh 100 5
```

### Troubleshooting

**Error: jq is required but not installed**
```bash
brew install jq
```

**Error: curl failed**
- Check your internet connection
- Verify the publisher URL is accessible
- Ensure the Walrus testnet is operational

**Error: Unexpected response format**
- Enable debug mode to see the full response
- Check if the publisher API has changed
- Verify your wallet address is valid

## Testing Workflow

1. **Upload test files** using `test-walrus-upload.sh`
2. **Check your wallet** at the front-end app to see blob objects
3. **List blobs** on the marketplace
4. **Test purchasing** blobs from other accounts
5. **Verify storage** using the explorer links

## Additional Notes

- All uploads go to **Walrus Testnet**
- Blob objects are automatically sent to your configured wallet address
- The script generates **Lorem Ipsum** style text for testing
- Files are temporarily created and automatically cleaned up
- Upload costs are paid by the publisher (testnet)

## Future Enhancements

Potential additions to this script:
- Support for uploading actual files (images, PDFs, etc.)
- Batch upload multiple files
- Custom blob metadata
- Integration with marketplace listing
- Automatic verification of blob availability
