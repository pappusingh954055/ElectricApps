USE [InventoryDb];
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[GatePasses]') AND type in (N'U'))
BEGIN
    DROP TABLE [GatePasses];
END
GO

CREATE TABLE [GatePasses] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [PassNo] NVARCHAR(50) NOT NULL, -- Unique Number (e.g., GP-2026-001)
    [PassType] NVARCHAR(20) NOT NULL, -- 'Inward', 'Outward'
    [ReferenceType] INT NOT NULL, -- 1=PO, 2=GRN, 3=Sale, 4=PurchaseReturn
    [ReferenceId] INT NOT NULL, -- Primary Key of linked document
    [ReferenceNo] NVARCHAR(50) NOT NULL, -- Display No e.g. PR-2026...
    [InvoiceNo] NVARCHAR(50) NULL, -- Supplier Invoice/Challan No for Inward
    [PartyName] NVARCHAR(100) NOT NULL, -- Supplier / Customer Name
    [VehicleNo] NVARCHAR(50) NOT NULL,
    [VehicleType] NVARCHAR(50) NULL, -- Tempo, Truck, Bike, LCV
    [DriverName] NVARCHAR(100) NOT NULL,
    [DriverPhone] NVARCHAR(20) NOT NULL,
    [TransporterName] NVARCHAR(100) NULL, -- replacing TransportName
    [TotalQty] DECIMAL(18,2) NOT NULL,
    [TotalWeight] DECIMAL(18,2) NULL, -- Physical weight
    [GateEntryTime] DATETIME2 NOT NULL, -- Entry/Exit Timestamp
    [SecurityGuard] NVARCHAR(100) NOT NULL,
    [Status] INT NOT NULL DEFAULT 1, -- 1=Entered, 2=Dispatched, 3=Cancelled
    [Remarks] NVARCHAR(MAX) NULL,
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedAt] DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT [PK_GatePasses] PRIMARY KEY ([Id]),
    CONSTRAINT [UQ_GatePasses_PassNo] UNIQUE ([PassNo])
);
GO
