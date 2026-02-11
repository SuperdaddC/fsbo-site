# ============================================================
# Outlook Contact Export — PowerShell Version
# Exports ALL contacts including user-defined fields
# For custom form: IPM.Contact.ColyerTeamContactForm
# ============================================================
# HOW TO USE:
# 1. Save this file to your Desktop
# 2. Right-click it → "Run with PowerShell"
#    OR open PowerShell and run: powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Desktop\export-contacts.ps1"
# 3. CSV saves to your Desktop automatically
# ============================================================

Write-Host "Starting Outlook Contact Export..." -ForegroundColor Cyan
Write-Host ""

# Connect to Outlook
try {
    $outlook = New-Object -ComObject Outlook.Application
    $ns = $outlook.GetNamespace("MAPI")
} catch {
    Write-Host "ERROR: Could not connect to Outlook. Make sure Outlook is running." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Get contacts folder — try default first
$contactsFolder = $ns.GetDefaultFolder(10)  # 10 = olFolderContacts
Write-Host "Using folder: $($contactsFolder.Name) ($($contactsFolder.Items.Count) items)" -ForegroundColor Green

# Output path
$savePath = "$env:USERPROFILE\Desktop\contacts_export.csv"

# Standard Outlook contact fields
$standardFields = @(
    "MessageClass", "FullName", "FirstName", "MiddleName", "LastName",
    "Title", "Suffix", "CompanyName", "Department", "JobTitle",
    "Email1Address", "Email1DisplayName", "Email2Address", "Email3Address",
    "BusinessTelephoneNumber", "Business2TelephoneNumber",
    "HomeTelephoneNumber", "Home2TelephoneNumber",
    "MobileTelephoneNumber", "OtherTelephoneNumber",
    "PagerNumber", "BusinessFaxNumber", "HomeFaxNumber",
    "BusinessAddressStreet", "BusinessAddressCity", "BusinessAddressState",
    "BusinessAddressPostalCode", "BusinessAddressCountry",
    "HomeAddressStreet", "HomeAddressCity", "HomeAddressState",
    "HomeAddressPostalCode", "HomeAddressCountry",
    "OtherAddressStreet", "OtherAddressCity", "OtherAddressState",
    "OtherAddressPostalCode", "OtherAddressCountry",
    "WebPage", "IMAddress", "NickName", "Spouse",
    "Birthday", "Anniversary",
    "Body", "Categories", "Sensitivity", "Importance",
    "CreationTime", "LastModificationTime",
    "FileAs", "Account", "CustomerID",
    "ReferredBy", "AssistantName", "AssistantTelephoneNumber",
    "ManagerName", "OfficeLocation", "Profession",
    "Children", "Hobby", "User1", "User2", "User3", "User4",
    "BillingInformation", "Mileage", "NetMeetingAlias"
)

# ---- PASS 1: Discover all user-defined fields from custom form contacts ----
Write-Host ""
Write-Host "Pass 1: Scanning for user-defined fields..." -ForegroundColor Yellow

$allHeaders = [ordered]@{}
foreach ($field in $standardFields) {
    $allHeaders[$field] = $true
}

$customCount = 0
$totalItems = $contactsFolder.Items.Count

for ($i = 1; $i -le $totalItems; $i++) {
    try {
        $item = $contactsFolder.Items.Item($i)
        if ($item.MessageClass -eq "IPM.Contact.ColyerTeamContactForm") {
            $customCount++
            $props = $item.ItemProperties
            for ($p = 0; $p -lt $props.Count; $p++) {
                try {
                    $propName = $props.Item($p).Name
                    if (-not $allHeaders.Contains($propName)) {
                        # Skip internal/system properties
                        if ($propName -notmatch '^\{' -and 
                            $propName -notmatch '^http:' -and 
                            $propName -notmatch '^urn:' -and
                            $propName -notmatch 'GUID' -and
                            $propName -notmatch '^0x' -and
                            $propName.Length -lt 100) {
                            $allHeaders[$propName] = $true
                        }
                    }
                } catch { }
            }
            [System.Runtime.Interopservices.Marshal]::ReleaseComObject($props) | Out-Null
        }
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($item) | Out-Null
    } catch { }
    
    if ($i % 100 -eq 0) {
        Write-Host "  Scanned $i / $totalItems contacts..." -ForegroundColor Gray
    }
}

$headerList = @($allHeaders.Keys)
$userFieldCount = $headerList.Count - $standardFields.Count

Write-Host "  Found $customCount custom form contacts" -ForegroundColor Green
Write-Host "  Found $userFieldCount user-defined fields" -ForegroundColor Green
Write-Host "  Total columns: $($headerList.Count)" -ForegroundColor Green

# ---- PASS 2: Export all contacts ----
Write-Host ""
Write-Host "Pass 2: Exporting contacts..." -ForegroundColor Yellow

# Helper function to escape CSV values
function EscapeCSV($val) {
    if ($null -eq $val) { return "" }
    $s = $val.ToString()
    $s = $s -replace "`r`n", " "
    $s = $s -replace "`n", " "
    $s = $s -replace "`r", " "
    if ($s -match '[,"\t]') {
        $s = '"' + ($s -replace '"', '""') + '"'
    }
    return $s
}

# Open file for writing
$stream = [System.IO.StreamWriter]::new($savePath, $false, [System.Text.Encoding]::UTF8)

# Write header row
$headerLine = ($headerList | ForEach-Object { EscapeCSV $_ }) -join ","
$stream.WriteLine($headerLine)

# Export each contact
$exportCount = 0
$errorCount = 0

for ($i = 1; $i -le $totalItems; $i++) {
    try {
        $item = $contactsFolder.Items.Item($i)
        
        # Only export ContactItems
        if ($item.Class -eq 40) {  # 40 = olContact
            $isCustom = ($item.MessageClass -eq "IPM.Contact.ColyerTeamContactForm")
            $values = @()
            
            foreach ($header in $headerList) {
                $val = ""
                try {
                    # Try direct property access first
                    $val = $item.PSObject.Properties[$header].Value
                    if ($null -eq $val) { throw "null" }
                } catch {
                    try {
                        # Try ItemProperties
                        $prop = $item.ItemProperties.Item($header)
                        if ($null -ne $prop) {
                            $val = $prop.Value
                        }
                    } catch {
                        $val = ""
                    }
                }
                
                # Clean up empty dates
                $valStr = if ($null -ne $val) { $val.ToString() } else { "" }
                if ($valStr -match "4501") { $valStr = "" }
                if ($valStr -eq "0" -and $header -notmatch "Number|Count|Volume") { 
                    # Keep zeros for number fields, blank for others
                }
                
                $values += EscapeCSV $valStr
            }
            
            $stream.WriteLine($values -join ",")
            $exportCount++
            
            [System.Runtime.Interopservices.Marshal]::ReleaseComObject($item) | Out-Null
        }
    } catch {
        $errorCount++
    }
    
    if ($i % 100 -eq 0) {
        Write-Host "  Exported $exportCount / $i contacts..." -ForegroundColor Gray
    }
}

$stream.Close()

# ---- DONE ----
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  EXPORT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Total contacts exported: $exportCount" -ForegroundColor White
Write-Host "  Custom form contacts:    $customCount" -ForegroundColor White
Write-Host "  User-defined fields:     $userFieldCount" -ForegroundColor White
Write-Host "  Total columns:           $($headerList.Count)" -ForegroundColor White
Write-Host "  Errors:                  $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Yellow" } else { "White" })
Write-Host ""
Write-Host "  Saved to: $savePath" -ForegroundColor Green
Write-Host ""
Write-Host "  Email this file to judy@vip.thecolyerteam.com" -ForegroundColor Yellow
Write-Host "  or just reply to any of Judy's emails with it attached." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
