-- Insert Expense Category and Expense Entry menu items
-- First, check the Finance parent menu ID
DECLARE @FinanceId INT = (SELECT Id FROM [dbo].[Menus] WHERE Title = 'Finance');

-- Insert Expense Categories
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Title = 'Expense Categories')
BEGIN
    INSERT INTO [dbo].[Menus] ([Title], [Url], [Icon], [ParentId], [Order])
    VALUES ('Expense Categories', '/app/finance/expenses/categories', 'category', @FinanceId, 10);
    
    PRINT 'Expense Categories menu item added';
END

-- Insert Expense Entry
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Title = 'Expense Entry')
BEGIN
    INSERT INTO [dbo].[Menus] ([Title], [Url], [Icon], [ParentId], [Order])
    VALUES ('Expense Entry', '/app/finance/expenses/entry', 'receipt_long', @FinanceId, 11);
    
    PRINT 'Expense Entry menu item added';
END

-- Show the inserted records
SELECT Id, Title, Url, Icon, ParentId, [Order] 
FROM [dbo].[Menus] 
WHERE ParentId = @FinanceId;

-- Grant permissions to Admin role (assuming RoleId for Admin is 1 or findable)
DECLARE @AdminRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE Name = 'Admin');
IF @AdminRoleId IS NULL SET @AdminRoleId = (SELECT Id FROM [dbo].[Roles] WHERE RoleName = 'Admin');

IF @AdminRoleId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[RolePermissions] (RoleId, MenuId, CanView, CanAdd, CanEdit, CanDelete)
    SELECT @AdminRoleId, Id, 1, 1, 1, 1 
    FROM [dbo].[Menus] 
    WHERE Title IN ('Expense Categories', 'Expense Entry')
    AND Id NOT IN (SELECT MenuId FROM [dbo].[RolePermissions] WHERE RoleId = @AdminRoleId);
    
    PRINT 'Permissions granted to Admin';
END
GO
