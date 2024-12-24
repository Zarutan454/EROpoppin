import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const search = searchParams.get('search') ?? '';
    const location = searchParams.get('location');
    const minPrice = parseInt(searchParams.get('minPrice') ?? '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') ?? '1000');

    const where = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
      ...(location && { city: { contains: location, mode: 'insensitive' } }),
      hourlyRate: {
        gte: minPrice,
        lte: maxPrice,
      },
      status: 'ACTIVE',
    };

    const [escorts, total] = await Promise.all([
      prisma.escortProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.escortProfile.count({ where }),
    ]);

    return NextResponse.json({
      data: escorts,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching escorts:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    const escort = await prisma.escortProfile.create({
      data: {
        ...data,
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json(escort, { status: 201 });
  } catch (error) {
    console.error('Error creating escort profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}