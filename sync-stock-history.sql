-- RECALCULATE Product Stock Script
-- Run this script to synchronize the CurrentStock column with actual transaction history.

UPDATE Products
SET CurrentStock = 
    ISNULL((
        -- 1. Total Accepted from GRN (Received - Rejected)
        SELECT SUM(gd.ReceivedQty - gd.RejectedQty)
        FROM GRNDetails gd
        WHERE gd.ProductId = Products.Id
    ), 0)
    - ISNULL((
        -- 2. Total Purchase Returns (Debit Notes)
        SELECT SUM(pri.ReturnQty)
        FROM PurchaseReturnItems pri
        WHERE pri.ProductId = Products.Id
    ), 0)
    - ISNULL((
        -- 3. Total Sold (Confirmed Orders)
        SELECT SUM(soi.Qty)
        FROM SaleOrderItems soi
        JOIN SaleOrders so ON soi.SaleOrderId = so.Id
        WHERE soi.ProductId = Products.Id AND so.Status IN ('Confirmed', 'Completed', 'Dispatch', 'Delivered')
    ), 0)
    + ISNULL((
        -- 4. Total Sales Returns (Credit Notes)
        SELECT SUM(sri.ReturnQty)
        FROM SaleReturnItems sri
        JOIN SaleReturnHeaders srh ON sri.SaleReturnHeaderId = srh.SaleReturnHeaderId
        WHERE sri.ProductId = Products.Id AND srh.Status IN ('Confirmed', 'INWARDED')
    ), 0);

-- Verification Query
SELECT Name, CurrentStock as UpdatedStock FROM Products;
