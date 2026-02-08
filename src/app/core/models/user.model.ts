export interface LoginDto {
    Email: string;
    Password: string;
}

export interface User {
    id: string;
    userName: string;
    email: string;
    isActive: boolean;
    roles: string[];
}

export interface RegisterUserDto {
    userName: string;
    email: string;
    password: string;
    roleIds: number[];
}