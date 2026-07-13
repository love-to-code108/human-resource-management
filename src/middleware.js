import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const token = request.cookies.get('elms_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) throw new Error('JWT_SECRET is missing');
    
    const key = new TextEncoder().encode(secretKey);
    await jwtVerify(token, key, { algorithms: ['HS256'] });
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
