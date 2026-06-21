import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      userType?: string | null;
      roleNames?: string[];
      vendorCode?: string | null;
      vendorName?: string | null;
      vendorCity?: string | null;
      oriOfficeCode?: string | null;
      oriOfficeName?: string | null;
      cmoEmpNo?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    userType?: string | null;
    roleNames?: string[];
    vendorCode?: string | null;
    vendorName?: string | null;
    vendorCity?: string | null;
    oriOfficeCode?: string | null;
    oriOfficeName?: string | null;
    cmoEmpNo?: string | null;
    rememberMe?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    userType?: string | null;
    roleNames?: string[];
    vendorCode?: string | null;
    vendorName?: string | null;
    vendorCity?: string | null;
    oriOfficeCode?: string | null;
    oriOfficeName?: string | null;
    cmoEmpNo?: string | null;
  }
}
