try {
  $path = "c:\Projects\ElectricApps\public\assets\templates\category_template.xlsx"
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
  $sheet.Cells.Item(1,1) = "CategoryCode"
  $sheet.Cells.Item(1,2) = "CategoryName"
  $sheet.Cells.Item(1,3) = "DefaultGst"
  $sheet.Cells.Item(1,4) = "Description"
  
  # Data from Screenshot
  $data = @(
    @("CAT001", "Wires & Cables", 18, "Electrical wiring and cables"),
    @("CAT002", "Switches & Sockets", 18, "Modular switches and sockets"),
    @("CAT003", "Lighting", 12, "Indoor and outdoor lighting"),
    @("CAT004", "Fans", 18, "Ceiling, wall and exhaust fans"),
    @("CAT005", "MCB & Distribution", 18, "Circuit breakers and DB boxes"),
    @("CAT006", "Conduits & Fittings", 18, "PVC conduits and accessories"),
    @("CAT007", "Electrical Accessories", 18, "Plugs, holders, connectors"),
    @("CAT008", "Industrial Electrical", 18, "Industrial electrical components"),
    @("CAT009", "Inverters & Batteries", 28, "Power backup products"),
    @("CAT010", "Smart Electrical", 18, "Smart home electrical devices")
  )

  for ($i = 0; $i -lt $data.Length; $i++) {
    for ($j = 0; $j -lt $data[$i].Length; $j++) {
      $sheet.Cells.Item($i + 2, $j + 1) = $data[$i][$j]
    }
  }

  # Formatting (Optional but nice)
  $headerRange = $sheet.Range("A1", "D1")
  $headerRange.Font.Bold = $true
  $sheet.Columns.AutoFit()

  $workbook.SaveAs($path)
  $workbook.Close()
  $excel.Quit()
  
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
  Write-Host "Excel template created successfully at $path"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
