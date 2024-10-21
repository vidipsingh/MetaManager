import React from 'react'
import Header from '@/components/Home/Header'
import Link from 'next/link'
import Image from 'next/image';
import Google from "../../../public/images/google_logo.png";
import { BackgroundBeams } from '@/components/ui/background-beams';

const SignUp = () => {
  return (
    <div className='relative'>
      <BackgroundBeams className='absolute inset-0'/>
    <div className='w-full 2xl:h-[1000px] lg:h-[700px] md:h-[800px] sm:h-[700px] h-[700px] pt-5 bg-black/95'>
    <Header />
    <div className="flex justify-center items-center my-8 z-50 relative">
      <div className='flex justify-between md:w-1/2 lg:w-2/5 text-white px-4'>
        <div className='w-full p-5 border border-gray-400 rounded-md bg-black/90'>
          <div>
            <h1 className='text-5xl font-semibold'>Sign Up</h1>
            <h1 className='my-3'>Already have an account? <Link href="/login"> <span className='text-purple-300 underline hover:text-purple-400 cursor-pointer'>Sign In</span> </Link></h1>
          </div>

          <form action="" className='flex flex-col mt-6'>
            <div className='flex gap-2'>
              <div className='w-1/2'>
                <h1 className='text-white/90 mb-1'>First Name</h1>
                <input type="name" name='first_name' placeholder='First Name' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
              </div>
              <div className='w-1/2'>
                <h1 className='text-white/90 mb-1'>Last Name</h1>
                <input type="name" name='last_name' placeholder='Last Name' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
              </div>
            </div>
            

            <div className='w-full my-4'>
              <h1 className='text-white/90 mb-1'>Email</h1>
              <input type="email" name='email' placeholder='Email' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
            </div>
            
            <div className='w-full my-4'>
              <h1 className='text-white/90 mb-1'>Password</h1>
              <input type="password" name='password' placeholder='********' required className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none' />
            </div>
            
            <button type='submit' className='w-full text-lg bg-purple-900 py-1 rounded-sm hover:bg-purple-950'>Sign Up</button>
          </form>

          <div className='flex justify-center items-center my-3 text-white/90'>OR</div>

          <div className='w-full flex justify-center items-center'>
            <button className='w-full py-2 border border-gray-400 rounded-md flex justify-center items-center gap-1 text-white/90 hover:bg-gray-900'>
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
