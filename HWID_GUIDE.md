# HWID (Hardware ID) Guide

## What is HWID?

HWID (Hardware ID) is a unique identifier generated from your computer's hardware components. It's used to bind a license to a specific machine, preventing license sharing.

## What Hardware Components Are Used?

The HWID is typically generated from a combination of:
- **CPU ID** (Processor serial number)
- **Motherboard Serial** (Mainboard serial number)
- **MAC Address** (Network adapter MAC address)
- **Hard Drive Serial** (Primary disk serial number)
- **BIOS UUID** (System UUID)

## How It Works

1. **First Login**: When a user logs in for the first time with a license, the HWID is automatically bound to that license
2. **Subsequent Logins**: The system checks if the HWID matches. If it doesn't match, access is denied
3. **Reset HWID**: Admin can reset the HWID, allowing the next login to bind to a new hardware ID

## Example HWID Generation (C#)

```csharp
using System;
using System.Management;
using System.Security.Cryptography;
using System.Text;

public class HardwareID
{
    public static string GetHardwareID()
    {
        StringBuilder sb = new StringBuilder();
        
        try
        {
            // CPU ID
            using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor"))
            {
                foreach (ManagementObject obj in searcher.Get())
                {
                    sb.Append(obj["ProcessorId"]?.ToString() ?? "");
                }
            }
            
            // Motherboard Serial
            using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard"))
            {
                foreach (ManagementObject obj in searcher.Get())
                {
                    sb.Append(obj["SerialNumber"]?.ToString() ?? "");
                }
            }
            
            // MAC Address (first network adapter)
            using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT MACAddress FROM Win32_NetworkAdapter WHERE MACAddress IS NOT NULL"))
            {
                foreach (ManagementObject obj in searcher.Get())
                {
                    sb.Append(obj["MACAddress"]?.ToString() ?? "");
                    break; // Use first MAC address
                }
            }
            
            // Hard Drive Serial
            using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_DiskDrive WHERE MediaType='Fixed hard disk media'"))
            {
                foreach (ManagementObject obj in searcher.Get())
                {
                    sb.Append(obj["SerialNumber"]?.ToString() ?? "");
                    break; // Use first drive
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting HWID: {ex.Message}");
            // Fallback to machine name + processor
            sb.Append(Environment.MachineName);
            sb.Append(Environment.ProcessorCount);
        }
        
        // Hash the combined string for security
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
            return BitConverter.ToString(hash).Replace("-", "").Substring(0, 32).ToUpper();
        }
    }
}
```

## Example HWID Generation (C++)

```cpp
#include <windows.h>
#include <wbemidl.h>
#include <comdef.h>
#include <string>
#include <sstream>
#include <iomanip>
#include <wincrypt.h>

std::string GetHardwareID() {
    std::stringstream hwid;
    
    // Initialize COM
    CoInitializeEx(NULL, COINIT_MULTITHREADED);
    CoInitializeSecurity(NULL, -1, NULL, NULL, RPC_C_AUTHN_LEVEL_NONE, RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE, NULL);
    
    // Create WMI locator
    IWbemLocator* pLoc = NULL;
    CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER, IID_IWbemLocator, (LPVOID*)&pLoc);
    
    // Connect to WMI
    IWbemServices* pSvc = NULL;
    pLoc->ConnectServer(_bstr_t(L"ROOT\\CIMV2"), NULL, NULL, 0, NULL, 0, 0, &pSvc);
    
    // Get CPU ID
    IEnumWbemClassObject* pEnumerator = NULL;
    pSvc->ExecQuery(bstr_t("WQL"), bstr_t("SELECT ProcessorId FROM Win32_Processor"), WBEM_FLAG_FORWARD_ONLY, NULL, &pEnumerator);
    
    IWbemClassObject* pclsObj = NULL;
    ULONG uReturn = 0;
    while (pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn) > 0) {
        VARIANT vtProp;
        pclsObj->Get(L"ProcessorId", 0, &vtProp, 0, 0);
        hwid << _bstr_t(vtProp.bstrVal);
        VariantClear(&vtProp);
        pclsObj->Release();
        break;
    }
    
    // Get Motherboard Serial
    pSvc->ExecQuery(bstr_t("WQL"), bstr_t("SELECT SerialNumber FROM Win32_BaseBoard"), WBEM_FLAG_FORWARD_ONLY, NULL, &pEnumerator);
    while (pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn) > 0) {
        VARIANT vtProp;
        pclsObj->Get(L"SerialNumber", 0, &vtProp, 0, 0);
        hwid << _bstr_t(vtProp.bstrVal);
        VariantClear(&vtProp);
        pclsObj->Release();
        break;
    }
    
    // Cleanup
    pSvc->Release();
    pLoc->Release();
    CoUninitialize();
    
    // Hash the result (simplified - use proper hashing in production)
    return hwid.str();
}
```

## Example HWID Generation (Python - for testing)

```python
import hashlib
import platform
import subprocess
import uuid

def get_hardware_id():
    """
    Generate a unique hardware ID from system components
    """
    components = []
    
    try:
        # CPU ID (Windows)
        if platform.system() == 'Windows':
            try:
                result = subprocess.run(['wmic', 'cpu', 'get', 'ProcessorId'], 
                                      capture_output=True, text=True)
                cpu_id = result.stdout.strip().split('\n')[1].strip()
                components.append(cpu_id)
            except:
                pass
            
            # Motherboard Serial
            try:
                result = subprocess.run(['wmic', 'baseboard', 'get', 'SerialNumber'], 
                                      capture_output=True, text=True)
                mb_serial = result.stdout.strip().split('\n')[1].strip()
                components.append(mb_serial)
            except:
                pass
            
            # MAC Address
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0,2*6,2)][::-1])
            components.append(mac)
        
        # Linux/Mac alternative
        else:
            components.append(platform.node())
            components.append(platform.processor())
    except Exception as e:
        print(f"Error getting HWID: {e}")
        # Fallback
        components.append(platform.node())
        components.append(str(uuid.getnode()))
    
    # Combine and hash
    combined = ''.join(components)
    return hashlib.sha256(combined.encode()).hexdigest()[:32].upper()
```

## How to Use in Your Loader

```csharp
// In your loader's login function
string email = GetEmailFromUser();
string password = GetPasswordFromUser();
string hwid = HardwareID.GetHardwareID(); // Generate HWID

var validator = new LicenseValidator();
var result = await validator.ValidateLicense(email, password, hwid);

if (result.Valid && result.HasLicense) {
    // License is valid, HWID is automatically bound/updated
    LaunchCheat();
} else {
    ShowError(result.Error);
}
```

## Important Notes

1. **HWID Changes**: If user changes hardware (new CPU, motherboard, etc.), the HWID will change and they'll need to contact admin for HWID reset
2. **Privacy**: The HWID is hashed, so it doesn't expose actual hardware serial numbers
3. **Security**: Always use HTTPS when sending HWID to prevent interception
4. **Fallback**: If HWID generation fails, use a fallback method (machine name + processor count)

## Admin Actions

- **Reset HWID**: Admin can reset the HWID of a key in the admin panel
- **After Reset**: Next login with that account will automatically bind to the new hardware
- **Multiple Devices**: Each reset allows binding to a new device (useful for users who upgrade hardware)



