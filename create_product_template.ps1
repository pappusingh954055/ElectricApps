try {
  $path = "c:\Projects\ElectricApps\public\assets\templates\product_template.xlsx"
  if (Test-Path $path) { 
    try {
        Remove-Item $path -Force 
    } catch {
        Write-Warning "Could not delete existing file."
    }
  }

  $excel = New-Object -ComObject Excel.Application
  $excel.DisplayAlerts = $false
  $workbook = $excel.Workbooks.Add()
  $sheet = $workbook.Worksheets.Item(1)
  
  # Headers
  $headers = @("Category", "Subcategory", "ProductName", "SKU", "Brand", "Unit", "BasePrice", "MRP", "SaleRate", "GST%", "HSNCode", "MinStock", "DamagedStock", "ProductType", "TrackInventory", "Active", "Description")
  
  for ($i = 0; $i -lt $headers.Length; $i++) {
    $sheet.Cells.Item(1, $i + 1) = $headers[$i]
  }
  
  # Data from Screenshot (10 Records)
  $data = @(
    @("Smart Electrical", "Smart Switch", "WiFi Smart Switch 6A", "SS001", "Wipro", "Nos", 450, 699, 650, 18, "853650", 10, 0, "Finished", "TRUE", "TRUE", "App controlled smart switch"),
    @("Smart Electrical", "Smart Switch", "WiFi Smart Switch 16A", "SS002", "Havells", "Nos", 650, 999, 920, 18, "853650", 8, 0, "Finished", "TRUE", "TRUE", "Heavy load smart switch"),
    @("Smart Electrical", "Smart Switch", "Touch Smart Switch", "SS003", "Anchor", "Nos", 900, 1399, 1250, 18, "853650", 6, 0, "Finished", "TRUE", "TRUE", "Touch panel switch"),
    @("Smart Electrical", "Smart Switch", "Voice Control Switch", "SS004", "Philips", "Nos", 1200, 1799, 1650, 18, "853650", 5, 0, "Finished", "TRUE", "TRUE", "Alexa enabled switch"),
    @("Smart Electrical", "Smart Switch", "Remote Smart Switch", "SS005", "Syska", "Nos", 700, 1099, 980, 18, "853650", 7, 0, "Finished", "TRUE", "TRUE", "Remote controlled switch"),
    @("Smart Electrical", "Smart Switch", "Glass Panel Smart Switch", "SS006", "GM", "Nos", 1500, 2199, 1990, 18, "853650", 4, 0, "Finished", "TRUE", "TRUE", "Premium glass panel"),
    @("Smart Electrical", "Smart Switch", "2 Module Smart Switch", "SS007", "Legrand", "Nos", 850, 1299, 1150, 18, "853650", 6, 0, "Finished", "TRUE", "TRUE", "Dual module switch"),
    @("Smart Electrical", "Smart Switch", "4 Module Smart Switch", "SS008", "Legrand", "Nos", 1100, 1699, 1550, 18, "853650", 5, 0, "Finished", "TRUE", "TRUE", "Four module switch"),
    @("Smart Electrical", "Smart Switch", "Dimmer Smart Switch", "SS009", "Panasonic", "Nos", 980, 1499, 1350, 18, "853650", 6, 0, "Finished", "TRUE", "TRUE", "Smart dimmer switch"),
    @("Smart Electrical", "Smart Switch", "Fan Control Smart Switch", "SS010", "Orient", "Nos", 1050, 1599, 1420, 18, "853650", 6, 0, "Finished", "TRUE", "TRUE", "Fan speed smart control")
  )

  for ($i = 0; $i -lt $data.Length; $i++) {
    for ($j = 0; $j -lt $data[$i].Length; $j++) {
      $sheet.Cells.Item($i + 2, $j + 1) = $data[$i][$j]
    }
  }

  # Formatting
  $headerRange = $sheet.Range("A1", "Q1")
  $headerRange.Font.Bold = $true
  $sheet.Columns.AutoFit()

  $workbook.SaveAs($path)
  $workbook.Close()
  $excel.Quit()
  
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
  Write-Host "Product Excel template created successfully at $path"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
