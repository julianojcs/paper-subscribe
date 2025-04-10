import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import prisma from "../../lib/db";
import { authOptions } from "../../lib/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "You must be logged in to submit a paper" },
        { status: 401 }
      );
    }

    const { title, abstract, authors, keywords } = await request.json();

    // Basic validation
    if (!title || !abstract || !authors || !keywords) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create submission in the database
    const submission = await prisma.submission.create({
      data: {
        title,
        abstract,
        authors,
        keywords,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error("Error submitting paper:", error);
    return NextResponse.json(
      { message: "Failed to submit paper" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "You must be logged in to view submissions" },
        { status: 401 }
      );
    }

    // Get user's submissions
    const submissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { message: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}