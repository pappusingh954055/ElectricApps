export const environment = {
    production: true,
    api: {
        inventory: 'http://localhost:5000/api/inventory',
        auth: 'http://localhost:5000/api/identity/auth',
        supplier: 'http://localhost:5000/api/suppliers',
        company: 'http://localhost:5000/api/company',
        identity: 'http://localhost:5000/api/identity',
        customer: 'http://localhost:5000/api/customers',
        sales: 'http://localhost:5000/api/sales'
    },
    // Backward compatibility for Gateway
    ApiBaseUrl: 'http://localhost:5000/api/inventory',
    LoginApiBaseUrl: 'http://localhost:5000/api/identity/auth',
    SupplierApiBaseUrl: 'http://localhost:5000/api/suppliers',
    CompanyApiBaseUrl: 'http://localhost:5000/api/company',
    CompanyRootUrl: 'http://localhost:5000/api/company',
    CustomerApiBaseUrl: 'http://localhost:5000/api/customers',
    SalesApiBaseUrl: 'http://localhost:5000/api/sales'
};
