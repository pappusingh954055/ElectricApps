-- Insert Purchase Return and Sale Return menu items
-- First, check the Inventory parent menu ID
DECLARE @InventoryId INT = (SELECT Id FROM [dbo].[Menus] WHERE Title = 'Inventory');

-- Insert Purchase Return
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Title = 'Purchase Return')
BEGIN
    INSERT INTO [dbo].[Menus] ([Title], [Url], [Icon], [ParentId], [Order])
    VALUES ('Purchase Return', '/app/inventory/purchase-return', 'assignment_return', @InventoryId, 5);
    
    PRINT 'Purchase Return menu item added';
END
ELSE
BEGIN
    PRINT 'Purchase Return menu item already exists';
END

-- Insert Sale Return
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Title = 'Sale Return')
BEGIN
    INSERT INTO [dbo].[Menus] ([Title], [Url], [Icon], [ParentId], [Order])
    VALUES ('Sale Return', '/app/inventory/sale-return', 'assignment_return', @InventoryId, 6);
    
    PRINT 'Sale Return menu item added';
END
ELSE
BEGIN
    PRINT 'Sale Return menu item already exists';
END

-- Show the inserted records
SELECT Id, Title, Url, Icon, ParentId, [Order] 
FROM [dbo].[Menus] 
WHERE Title IN ('Purchase Return', 'Sale Return');
