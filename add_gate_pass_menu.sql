-- Insert Gate Pass menu item under Inventory
DECLARE @InventoryId INT = (SELECT Id FROM [dbo].[Menus] WHERE Title = 'Inventory');

-- Insert Gate Pass
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Title = 'Gate Pass')
BEGIN
    INSERT INTO [dbo].[Menus] ([Title], [Url], [Icon], [ParentId], [Order])
    VALUES ('Gate Pass', '/app/inventory/gate-pass', 'security', @InventoryId, 7);
    
    PRINT 'Gate Pass menu item added';
END
ELSE
BEGIN
    -- Update existing menu item to ensure URL is correct
    UPDATE [dbo].[Menus] 
    SET [Url] = '/app/inventory/gate-pass',
        [Icon] = 'security'
    WHERE Title = 'Gate Pass';
    
    PRINT 'Gate Pass menu item updated';
END

-- Show the inserted/updated record
SELECT Id, Title, Url, Icon, ParentId, [Order] 
FROM [dbo].[Menus] 
WHERE Title = 'Gate Pass';
