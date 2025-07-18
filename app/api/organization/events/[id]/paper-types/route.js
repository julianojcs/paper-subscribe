import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { prisma } from '@/lib/db';

export async function GET(request, context) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const params = await context.params;
    const { id } = params;


    // Validate event ID
    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Check if user has access to this organization's event
    const event = await prisma.event.findFirst({
      where: {
        id,
        organization: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    });

    // console.log('Event found:', event);
    // return NextResponse.json({ event });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 });
    }

    // Fetch paper types for the event
    const paperTypes = await prisma.eventPaperType.findMany({
      where: {
        eventId: id
      },
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(paperTypes);

  } catch (error) {
    console.error('Error fetching event paper types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}