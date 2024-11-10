"use client"

import React, { useEffect, useState } from 'react'
import Header from '@/components/Home/Header'
import Link from 'next/link'
import Image from 'next/image';
import Google from "../../../public/images/google_logo.png";
import { BackgroundBeams } from '@/components/ui/background-beams';
import { signIn } from "next-auth/react";
import Alert from '@mui/material/Alert';
import { useRouter } from "next/navigation";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setShowAlert(true);

    // If user creation is successful, wait for 3 seconds before redirecting to /dashboard
    if (data.message) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500); // 3-second delay
    }
  };

  return (
    <div className='relative'>
      <BackgroundBeams className='absolute inset-0'/>
    <div className='w-full 2xl:h-[1000px] lg:h-[700px] md:h-[800px] sm:h-[700px] h-[700px] pt-5 bg-black/95'>
    <div className="flex justify-center items-center">
      {showAlert && (
        <div className="fixed top-5 left-1/2 w-full transform -translate-x-1/2 z-50">
          <Alert severity="info" className="w-1/4 mx-auto">
            {message}
          </Alert>
        </div>
      )}
    </div>
    <Header />
    <div className="flex justify-center items-center my-8 z-40 relative">
      <div className='flex justify-between md:w-1/2 lg:w-2/5 text-white px-4'>
        <div className='w-full p-5 border border-gray-400 rounded-md bg-black/90'>
          <div>
            <h1 className='text-5xl font-semibold'>Sign Up</h1>
            <h1 className='my-3'>Already have an account? <Link href="/login"> <span className='text-purple-300 underline hover:text-purple-400 cursor-pointer'>Sign In</span> </Link></h1>
          </div>

          <form action="" className='flex flex-col mt-6' onSubmit={handleRegister}>
            <div className='flex gap-2'>
              <div className='w-full'>
                <h1 className='text-white/90 mb-1'>Name</h1>
                <input type="text" name='name' value={name} placeholder='Name' onChange={(e) => setName(e.target.value)} required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
              </div>
              {/* <div className='w-1/2'>
                <h1 className='text-white/90 mb-1'>Last Name</h1>
                <input type="name" name='last_name' placeholder='Last Name' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
              </div> */}
            </div>
            

            <div className='w-full my-4'>
              <h1 className='text-white/90 mb-1'>Email</h1>
              <input type="email" name='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
            </div>
            
            <div className='w-full my-4'>
              <h1 className='text-white/90 mb-1'>Password</h1>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} name='password' placeholder='********' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
            </div>
            
            <button type='submit' className='w-full text-lg bg-purple-900 py-1.5 rounded-sm hover:bg-purple-950'>Sign Up</button>
          </form>
          
          

          <div className='flex justify-center items-center my-3 text-white/90'>OR</div>

          <div className='w-full flex justify-center items-center'>
            <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className='w-full py-2 border border-gray-400 rounded-md flex justify-center items-center gap-1 text-white/90 hover:bg-gray-900'>
            <Image src={Google} width={30} height={30} alt={''} className='rounded-full'  />
              Sign Up With Google</button>
          </div>
        </div>

      </div>
    </div>
   
  </div>

  </div>
  )
}

export default SignUp
