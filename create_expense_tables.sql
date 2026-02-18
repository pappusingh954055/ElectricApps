USE [InventoryDb];
GO

CREATE TABLE [ExpenseCategories] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedDate] DATETIME2 NULL DEFAULT GETDATE(),
    [UpdatedDate] DATETIME2 NULL DEFAULT GETDATE(),
    [CreatedBy] NVARCHAR(MAX) NULL,
    [UpdatedBy] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_ExpenseCategories] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [ExpenseEntries] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [CategoryId] INT NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [ExpenseDate] DATETIME2 NOT NULL,
    [PaymentMode] NVARCHAR(50) NOT NULL,
    [ReferenceNo] NVARCHAR(MAX) NULL,
    [Remarks] NVARCHAR(MAX) NULL,
    [AttachmentPath] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NULL DEFAULT GETDATE(),
    [UpdatedDate] DATETIME2 NULL DEFAULT GETDATE(),
    [CreatedBy] NVARCHAR(MAX) NULL,
    [UpdatedBy] NVARCHAR(MAX) NULL,
    CONSTRAINT [PK_ExpenseEntries] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ExpenseEntries_ExpenseCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [ExpenseCategories] ([Id]) ON DELETE RESTRICT
);
GO

-- Seed some initial categories
INSERT INTO [ExpenseCategories] ([Name], [IsActive]) VALUES ('Rent', 1);
INSERT INTO [ExpenseCategories] ([Name], [IsActive]) VALUES ('Salary', 1);
INSERT INTO [ExpenseCategories] ([Name], [IsActive]) VALUES ('Electricity', 1);
INSERT INTO [ExpenseCategories] ([Name], [IsActive]) VALUES ('Tea/Snacks', 1);
GO
