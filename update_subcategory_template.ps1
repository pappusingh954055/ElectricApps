try {
  $path = "c:\Projects\ElectricApps\public\assets\templates\subcategory_template.xlsx"
  if (Test-Path $path) { 
    try {
        Remove-Item $path -Force 
    } catch {
        Write-Warning "Could not delete existing file. It might be open."
    }
  }

  $excel = New-Object -ComObject Excel.Application
  $excel.DisplayAlerts = $false
  $workbook = $excel.Workbooks.Add()
  $sheet = $workbook.Worksheets.Item(1)
  
  # Headers
  $sheet.Cells.Item(1,1) = "SubcategoryCode"
  $sheet.Cells.Item(1,2) = "CategoryName"
  $sheet.Cells.Item(1,3) = "SubcategoryName"
  $sheet.Cells.Item(1,4) = "DefaultGst"
  $sheet.Cells.Item(1,5) = "Description"
  
  # Data from Screenshot (30 Records)
  $data = @(
    @("SUB001", "Wires & Cables", "Copper Wire", 18, "Copper electrical wire"),
    @("SUB002", "Wires & Cables", "Aluminium Wire", 18, "Aluminium wiring"),
    @("SUB003", "Wires & Cables", "Flexible Cable", 18, "Multi strand cable"),
    @("SUB004", "Switches & Sockets", "Modular Switch", 18, "Designer switches"),
    @("SUB005", "Switches & Sockets", "Power Socket", 18, "Multi pin socket"),
    @("SUB006", "Switches & Sockets", "Switch Board", 18, "Electrical switch board"),
    @("SUB007", "Lighting", "LED Bulb", 12, "Energy efficient bulb"),
    @("SUB008", "Lighting", "Tube Light", 12, "LED tube light"),
    @("SUB009", "Lighting", "Panel Light", 12, "Ceiling panel light"),
    @("SUB010", "Lighting", "Street Light", 12, "Outdoor lighting"),
    @("SUB011", "Fans", "Ceiling Fan", 18, "Ceiling mounted fan"),
    @("SUB012", "Fans", "Exhaust Fan", 18, "Ventilation fan"),
    @("SUB013", "Fans", "Wall Fan", 18, "Wall mounted fan"),
    @("SUB014", "MCB & Distribution", "MCB", 18, "Circuit breaker"),
    @("SUB015", "MCB & Distribution", "RCCB", 18, "Residual breaker"),
    @("SUB016", "MCB & Distribution", "Distribution Board", 18, "DB box"),
    @("SUB017", "Conduits & Fittings", "PVC Conduit", 18, "PVC wiring pipe"),
    @("SUB018", "Conduits & Fittings", "Junction Box", 18, "Wire junction box"),
    @("SUB019", "Conduits & Fittings", "Conduit Bend", 18, "Pipe bend"),
    @("SUB020", "Electrical Accessories", "Plug Top", 18, "Electric plug"),
    @("SUB021", "Electrical Accessories", "Holder", 18, "Bulb holder"),
    @("SUB022", "Electrical Accessories", "Extension Board", 18, "Extension cord"),
    @("SUB023", "Industrial Electrical", "Contactor", 18, "Industrial contactor"),
    @("SUB024", "Industrial Electrical", "Relay", 18, "Electrical relay"),
    @("SUB025", "Industrial Electrical", "Timer", 18, "Electrical timer"),
    @("SUB026", "Inverters & Batteries", "Inverter", 28, "Power inverter"),
    @("SUB027", "Inverters & Batteries", "Battery", 28, "Backup battery"),
    @("SUB028", "Inverters & Batteries", "UPS", 28, "Power backup"),
    @("SUB029", "Smart Electrical", "Smart Switch", 18, "WiFi switch"),
    @("SUB030", "Smart Electrical", "Smart Plug", 18, "App control plug")
  )

  for ($i = 0; $i -lt $data.Length; $i++) {
    for ($j = 0; $j -lt $data[$i].Length; $j++) {
      $sheet.Cells.Item($i + 2, $j + 1) = $data[$i][$j]
    }
  }

  # Formatting
  $headerRange = $sheet.Range("A1", "E1")
  $headerRange.Font.Bold = $true
  $sheet.Columns.AutoFit()

  $workbook.SaveAs($path)
  $workbook.Close()
  $excel.Quit()
  
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
  Write-Host "Subcategory Excel template created successfully at $path"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
