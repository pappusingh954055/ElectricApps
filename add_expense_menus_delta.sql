USE [IdentityDb];
GO

-- 1. IDENTIFY THE FINANCE ROOT (From your previous script, it's Id: 23)
DECLARE @FinanceId INT = 23;

-- Ensure Finance exists (safety check)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Id = @FinanceId)
BEGIN
    SET @FinanceId = (SELECT Id FROM [dbo].[Menus] WHERE Title = 'Finance');
END

-- 2. ADD EXPENSE MENUS (Only delta)
SET IDENTITY_INSERT [dbo].[Menus] ON;

-- Adding Expenses Group under Finance
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Id = 35 OR Title = 'Expenses')
BEGIN
    INSERT INTO [dbo].[Menus] ([Id], [Title], [Url], [Icon], [ParentId], [Order]) 
    VALUES (35, 'Expenses', '', 'account_balance_wallet', @FinanceId, 4);
    PRINT 'Expense Group Menu added';
END

-- Adding Expense Categories under Expenses Group
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Id = 36 OR Title = 'Expense Categories')
BEGIN
    INSERT INTO [dbo].[Menus] ([Id], [Title], [Url], [Icon], [ParentId], [Order]) 
    VALUES (36, 'Expense Categories', '/app/finance/expenses/categories', 'category', 35, 1);
    PRINT 'Expense Categories menu added';
END

-- Adding Expense Entry under Expenses Group
IF NOT EXISTS (SELECT 1 FROM [dbo].[Menus] WHERE Id = 37 OR Title = 'Expense Entry')
BEGIN
    INSERT INTO [dbo].[Menus] ([Id], [Title], [Url], [Icon], [ParentId], [Order]) 
    VALUES (37, 'Expense Entry', '/app/finance/expenses/entry', 'receipt_long', 35, 2);
    PRINT 'Expense Entry menu added';
END

SET IDENTITY_INSERT [dbo].[Menus] OFF;

-- 3. GRANT PERMISSIONS TO ADMIN (Assuming RoleId 1 is Admin)
DECLARE @AdminRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE RoleName = 'Admin');
IF @AdminRoleId IS NULL SET @AdminRoleId = 1; -- Fallback

INSERT INTO [dbo].[RolePermissions] ([RoleId], [MenuId], [CanView], [CanAdd], [CanEdit], [CanDelete])
SELECT @AdminRoleId, Id, 1, 1, 1, 1 
FROM [dbo].[Menus] 
WHERE Id IN (35, 36, 37)
AND Id NOT IN (SELECT MenuId FROM [dbo].[RolePermissions] WHERE RoleId = @AdminRoleId);

PRINT 'SUCCESS: Expense menus and permissions added to Finance section.';
GO
