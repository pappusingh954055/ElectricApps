try {
  $path = "c:\Projects\ElectricApps\public\assets\templates\subcategory_template.xlsx"
  if (Test-Path $path) { Remove-Item $path -Force }

  $excel = New-Object -ComObject Excel.Application
  $excel.DisplayAlerts = $false
  $workbook = $excel.Workbooks.Add()
  $sheet = $workbook.Worksheets.Item(1)
  
  $sheet.Cells.Item(1,1) = "SubcategoryCode"
  $sheet.Cells.Item(1,2) = "CategoryName"
  $sheet.Cells.Item(1,3) = "SubcategoryName"
  $sheet.Cells.Item(1,4) = "DefaultGst"
  $sheet.Cells.Item(1,5) = "Description"
  
  $sheet.Cells.Item(2,1) = "LED-001"
  $sheet.Cells.Item(2,2) = "Lighting"
  $sheet.Cells.Item(2,3) = "LED Bulb"
  $sheet.Cells.Item(2,4) = 18
  $sheet.Cells.Item(2,5) = "LED Bulb 9W"

  $workbook.SaveAs($path)
  $workbook.Close()
  $excel.Quit()
  
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
  Write-Host "Success"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
