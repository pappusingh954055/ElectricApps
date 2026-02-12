export const environment = {
  production: false,
  api: {
    inventory: 'https://localhost:7052/api',
    auth: 'https://localhost:7125/api/auth',
    supplier: 'https://localhost:7224/api/suppliers',
    company: 'https://localhost:7065/api',
    identity: 'https://localhost:7125/api',
    customer: 'https://localhost:7173/api',
    sales: 'https://localhost:7091/api'
  },
  // Backward compatibility
  ApiBaseUrl: 'https://localhost:7052/api',
  LoginApiBaseUrl: 'https://localhost:7125/api/auth',
  SupplierApiBaseUrl: 'https://localhost:7224/api/Supplier',
  CompanyApiBaseUrl: 'https://localhost:7065/api',
  CompanyRootUrl: 'https://localhost:7065',
  CustomerApiBaseUrl: 'https://localhost:7173/api',
  SalesApiBaseUrl: 'https://localhost:7091/api'
};
