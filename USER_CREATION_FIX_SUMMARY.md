# User Creation Fix - Summary

## Problem
The user creation was failing with a database error related to the `CreatedAt` column in the `dbo.Users` table. The error occurred because:
1. The database column `CreatedAt` was defined as `NOT NULL`
2. Entity Framework was not properly setting the `CreatedAt` value during INSERT operations

## Changes Made

### 1. Frontend Changes (Already Applied)
**File: `user.model.ts`**
- Updated `RegisterUserDto` to use PascalCase properties to match backend expectations:
  - `userName` → `UserName`
  - `email` → `Email`
  - `password` → `Password`
  - `roleIds` → `RoleIds`

**File: `user-form.component.ts`**
- Updated form controls and template references to use PascalCase property names

### 2. Backend Changes (Applied)

#### A. Database Context Enhancement
**File: `Identity.Infrastructure/Persistence/IdentityDbContext.cs`**
- Added `SaveChangesAsync` override to automatically set `CreatedAt` timestamp for new entities
- This ensures that every time a new user (or any AuditableEntity) is created, the `CreatedAt` field is set to `DateTime.UtcNow`

#### B. Entity Configuration
**File: `Identity.Infrastructure/Persistence/Configurations/UserConfiguration.cs`**
- Added explicit configuration for audit fields:
  - `CreatedAt`: Required with SQL default value `GETUTCDATE()`
  - `ModifiedAt`: Optional (nullable)

#### C. DTO Update
**File: `Identity.Application/DTOs/RegisterUserDto.cs`**
- Changed from single `RoleName` (string) to `RoleIds` (int array)
- This allows users to be assigned multiple roles during registration

#### D. Command Handler Update
**File: `Identity.Application/Commands/RegisterUser/RegisterUserCommandHandler.cs`**
- Updated to handle multiple role IDs
- Added validation to ensure at least one role is provided
- Loops through all role IDs and assigns them to the user

### 3. Database Migration Required

You need to run the SQL script to update your database schema:

**File: `c:\Projects\ElectricApps\fix_users_table_createdAt.sql`**

This script provides two options:
1. **Option 1**: Make `CreatedAt` nullable (simpler, recommended for quick fix)
2. **Option 2**: Add a default constraint for `CreatedAt` (keeps NOT NULL requirement)

## How to Apply the Fix

### Step 1: Rebuild the Backend
Navigate to the backend solution and rebuild:
```bash
cd c:\Projects\Microservices\SchoolManagementSystem
dotnet build
```

### Step 2: Run the Database Script
Open SQL Server Management Studio and run the script:
`c:\Projects\ElectricApps\fix_users_table_createdAt.sql`

Choose either Option 1 or Option 2 from the script.

### Step 3: Restart the Backend Services
Restart your Identity.API service to apply the code changes.

### Step 4: Test User Creation
1. Navigate to the User Management page in your Angular app
2. Click "Create User"
3. Fill in the form:
   - Username: test user name
   - Email: valid email
   - Password: secure password
   - Roles: Select one or more roles
4. Click "Create User"

## Expected Behavior After Fix

✅ Users can be created successfully
✅ `CreatedAt` is automatically set to the current UTC time
✅ Multiple roles can be assigned to a user during registration
✅ No more database constraint violations

## Technical Details

### Why the Error Occurred
1. The `User` entity inherits from `AuditableEntity` which has a `CreatedAt` property
2. The property has a default value in C# (`DateTime.UtcNow`), but this wasn't being properly translated to the database
3. The database column was set to `NOT NULL` without a default constraint
4. When EF Core tried to insert a new user, it didn't include a value for `CreatedAt`, causing a constraint violation

### How the Fix Works
1. **SaveChangesAsync Override**: Intercepts all save operations and explicitly sets `CreatedAt` for new entities
2. **Database Default Constraint**: Provides a fallback at the database level
3. **Entity Configuration**: Ensures EF Core knows how to handle these fields properly

## Additional Notes

- The `ModifiedAt` field is now properly configured as nullable
- The `SetModified()` method is automatically called when entities are updated
- All entities that inherit from `AuditableEntity` will benefit from this fix
