import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const { email, password, name } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    try{
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            }
        });
        return NextResponse.json({ message: "User created successfully :)" });
    } catch(error){
        return NextResponse.json({ error: "User already exists!" }, { status: 400 })
    }
}