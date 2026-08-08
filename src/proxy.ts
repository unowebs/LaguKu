import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Next.js 16: file renamed from middleware.ts → proxy.ts
// Default export is still supported per the proxy convention docs.
export default withAuth(
  function proxy(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*', '/room/:path*'],
};
