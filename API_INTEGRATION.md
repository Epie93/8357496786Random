# API Integration Guide for .exe Application

## Overview
This guide explains how to integrate your .exe application with the web API to validate credentials and check license status.

## Two Methods Available

### Method 1: Validate License (Recommended)
Use email/password to check if the account has an active license.

### Method 2: Validate Key
Use a key string to validate a specific key.

## API Endpoints

### 1. Validate License (Email/Password) - RECOMMENDED
**URL:** `https://your-domain.com/api/validate-license`  
**Method:** `POST`  
**Content-Type:** `application/json`

This endpoint validates email/password and checks if the account has an active license.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "hwid": "optional-hardware-id"
}
```

#### Response (Valid License)
```json
{
  "valid": true,
  "authenticated": true,
  "hasLicense": true,
  "license": {
    "key": "XXXX-XXXX-XXXX-XXXX",
    "duration": "1 mois",
    "expiresAt": "2024-02-01T00:00:00.000Z",
    "claimedAt": "2024-01-01T00:00:00.000Z",
    "isLifetime": false,
    "timeRemaining": "25d 12h 30m",
    "hwid": "optional-hwid"
  },
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "message": "License is valid"
}
```

#### Response (No License)
```json
{
  "valid": true,
  "authenticated": true,
  "hasLicense": false,
  "error": "No active license found. Please claim a key on the website.",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

#### Response (Expired License)
```json
{
  "valid": true,
  "authenticated": true,
  "hasLicense": false,
  "error": "License has expired",
  "expired": true,
  "lastExpiry": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

#### Response (Invalid Credentials)
```json
{
  "valid": false,
  "hasLicense": false,
  "error": "Invalid credentials"
}
```

### 2. Validate Key (Key String)
**URL:** `https://your-domain.com/api/validate-key`  
**Method:** `POST`  
**Content-Type:** `application/json`

### Request Body
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "optional-hardware-id"
}
```

### Response (Valid Key)
```json
{
  "valid": true,
  "key": "XXXX-XXXX-XXXX-XXXX",
  "duration": "1 mois",
  "expiresAt": "2024-02-01T00:00:00.000Z",
  "claimedAt": "2024-01-01T00:00:00.000Z",
  "message": "Key is valid"
}
```

### Response (Invalid Key)
```json
{
  "valid": false,
  "error": "Invalid key"
}
```

### Response (Expired Key)
```json
{
  "valid": false,
  "error": "Key has expired",
  "expired": true
}
```

### Response (HWID Mismatch)
```json
{
  "valid": false,
  "error": "Key is bound to a different hardware ID",
  "hwidMismatch": true
}
```

## Example Implementation (C#)

### Method 1: Validate License (Email/Password) - RECOMMENDED

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class LicenseValidator
{
    private readonly string apiUrl = "https://your-domain.com/api/validate-license";
    private readonly HttpClient httpClient;

    public LicenseValidator()
    {
        httpClient = new HttpClient();
    }

    public async Task<LicenseValidationResult> ValidateLicense(string email, string password, string hwid = null)
    {
        try
        {
            var requestBody = new
            {
                email = email,
                password = password,
                hwid = hwid ?? GetHardwareId()
            };

            var json = JsonConvert.SerializeObject(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(apiUrl, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            var result = JsonConvert.DeserializeObject<LicenseValidationResult>(responseContent);
            return result;
        }
        catch (Exception ex)
        {
            return new LicenseValidationResult
            {
                Valid = false,
                HasLicense = false,
                Error = $"Connection error: {ex.Message}"
            };
        }
    }

    private string GetHardwareId()
    {
        // Get CPU ID, Motherboard Serial, etc.
        // Example: return System.Management.ManagementObject...
        return Environment.MachineName; // Simple example
    }
}

public class LicenseValidationResult
{
    [JsonProperty("valid")]
    public bool Valid { get; set; }

    [JsonProperty("authenticated")]
    public bool Authenticated { get; set; }

    [JsonProperty("hasLicense")]
    public bool HasLicense { get; set; }

    [JsonProperty("error")]
    public string Error { get; set; }

    [JsonProperty("expired")]
    public bool Expired { get; set; }

    [JsonProperty("hwidMismatch")]
    public bool HwidMismatch { get; set; }

    [JsonProperty("license")]
    public LicenseInfo License { get; set; }

    [JsonProperty("user")]
    public UserInfo User { get; set; }
}

public class LicenseInfo
{
    [JsonProperty("key")]
    public string Key { get; set; }

    [JsonProperty("duration")]
    public string Duration { get; set; }

    [JsonProperty("expiresAt")]
    public DateTime? ExpiresAt { get; set; }

    [JsonProperty("isLifetime")]
    public bool IsLifetime { get; set; }

    [JsonProperty("timeRemaining")]
    public string TimeRemaining { get; set; }
}

public class UserInfo
{
    [JsonProperty("id")]
    public string Id { get; set; }

    [JsonProperty("email")]
    public string Email { get; set; }
}

// Usage in your loader:
var validator = new LicenseValidator();
var result = await validator.ValidateLicense("user@example.com", "password");

if (result.Valid && result.HasLicense)
{
    // User has active license, allow access
    Console.WriteLine($"License valid! Time remaining: {result.License.TimeRemaining}");
    LaunchCheat();
}
else
{
    // No license or expired
    Console.WriteLine($"Error: {result.Error}");
    ShowError(result.Error);
}
```

### Method 2: Validate Key (Key String)

```csharp
public class KeyValidator
{
    private readonly string apiUrl = "https://your-domain.com/api/validate-key";
    private readonly HttpClient httpClient;

    public KeyValidator()
    {
        httpClient = new HttpClient();
    }

    public async Task<ValidationResult> ValidateKey(string key, string hwid = null)
    {
        try
        {
            var requestBody = new
            {
                key = key,
                hwid = hwid ?? GetHardwareId()
            };

            var json = JsonConvert.SerializeObject(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync(apiUrl, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            var result = JsonConvert.DeserializeObject<ValidationResult>(responseContent);
            return result;
        }
        catch (Exception ex)
        {
            return new ValidationResult
            {
                Valid = false,
                Error = $"Connection error: {ex.Message}"
            };
        }
    }

    private string GetHardwareId()
    {
        // Get CPU ID, Motherboard Serial, etc.
        // Example: return System.Management.ManagementObject...
        return Environment.MachineName; // Simple example
    }
}

public class ValidationResult
{
    [JsonProperty("valid")]
    public bool Valid { get; set; }

    [JsonProperty("error")]
    public string Error { get; set; }

    [JsonProperty("expired")]
    public bool Expired { get; set; }

    [JsonProperty("hwidMismatch")]
    public bool HwidMismatch { get; set; }

    [JsonProperty("duration")]
    public string Duration { get; set; }

    [JsonProperty("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}
```

## Example Implementation (C++)

```cpp
#include <windows.h>
#include <winhttp.h>
#include <string>
#include <iostream>

struct ValidationResult {
    bool valid;
    std::string error;
    bool expired;
    bool hwidMismatch;
};

ValidationResult ValidateKey(const std::string& key, const std::string& hwid) {
    ValidationResult result = {false, "", false, false};
    
    // Use WinHTTP or libcurl to make POST request
    // Example using WinHTTP:
    
    HINTERNET hSession = WinHttpOpen(L"KeyValidator/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS, 0);

    if (hSession) {
        HINTERNET hConnect = WinHttpConnect(hSession, L"your-domain.com", INTERNET_DEFAULT_HTTPS_PORT, 0);
        
        if (hConnect) {
            HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST",
                L"/api/validate-key",
                NULL, WINHTTP_NO_REFERER,
                WINHTTP_DEFAULT_ACCEPT_TYPES,
                WINHTTP_FLAG_SECURE);

            if (hRequest) {
                std::string json = "{\"key\":\"" + key + "\",\"hwid\":\"" + hwid + "\"}";
                
                WinHttpSendRequest(hRequest,
                    L"Content-Type: application/json\r\n",
                    -1, (LPVOID)json.c_str(), json.length(),
                    json.length(), 0);

                WinHttpReceiveResponse(hRequest, NULL);

                // Read response and parse JSON
                // Parse result.valid, result.error, etc.
            }
        }
    }
    
    return result;
}
```

## Example Implementation (Python - for testing)

### Method 1: Validate License (Email/Password) - RECOMMENDED

```python
import requests
import json

def validate_license(email, password, hwid=None):
    url = "https://your-domain.com/api/validate-license"
    
    payload = {
        "email": email,
        "password": password,
        "hwid": hwid or get_hardware_id()
    }
    
    try:
        response = requests.post(url, json=payload)
        result = response.json()
        
        if result.get("valid") and result.get("hasLicense"):
            license_info = result.get("license", {})
            print(f"License valid! Time remaining: {license_info.get('timeRemaining')}")
            print(f"Duration: {license_info.get('duration')}")
            return True
        else:
            print(f"Error: {result.get('error')}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

# Usage:
if validate_license("user@example.com", "password"):
    launch_cheat()
else:
    show_error("No valid license")

def get_hardware_id():
    import platform
    import hashlib
    
    # Get unique hardware identifiers
    machine_id = platform.node() + platform.processor()
    return hashlib.md5(machine_id.encode()).hexdigest()
```

### Method 2: Validate Key (Key String)

```python
def validate_key(key, hwid=None):
    url = "https://your-domain.com/api/validate-key"
    
    payload = {
        "key": key,
        "hwid": hwid or get_hardware_id()
    }
    
    try:
        response = requests.post(url, json=payload)
        result = response.json()
        
        if result.get("valid"):
            print(f"Key is valid! Duration: {result.get('duration')}")
            return True
        else:
            print(f"Key invalid: {result.get('error')}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS to prevent key interception
2. **HWID Binding**: Bind keys to hardware IDs to prevent sharing
3. **Rate Limiting**: Implement rate limiting on the API endpoint
4. **IP Whitelisting**: Optionally whitelist IPs for production
5. **API Key**: Consider adding an API key for additional security

## Rate Limiting

To prevent abuse, you might want to add rate limiting:

```typescript
// In validate-key/route.ts, add rate limiting logic
// Example: Max 10 requests per minute per IP
```

## Testing

You can test the API using curl:

```bash
curl -X POST https://your-domain.com/api/validate-key \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR-KEY-HERE","hwid":"test-hwid"}'
```

## Next Steps

1. Replace `your-domain.com` with your actual domain
2. Implement the HTTP client in your .exe
3. Add HWID generation in your .exe
4. Handle validation responses appropriately
5. Add error handling and retry logic
6. Consider caching validation results (with expiration)

