"use client"

import Header from '@/components/Home/Header'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Google from "../../../public/images/google_logo.png"
import { BackgroundBeams } from '@/components/ui/background-beams'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { signIn } from "next-auth/react"
import Alert from '@mui/material/Alert'
import { useRouter } from 'next/navigation'

interface LoginResponse {
  token?: string;
  error?: string;
}

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("")
  const [showAlert, setShowAlert] = useState(false)
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info'>('info')
  const router = useRouter()

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data: LoginResponse = await res.json()
      
      if (data.token) {
        localStorage.setItem("token", data.token)
        setMessage("Login successful!")
        setAlertSeverity('success')
        setShowAlert(true)
        
        // Redirect to dashboard after success message
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setMessage(data.error || "Login failed")
        setAlertSeverity('error')
        setShowAlert(true)
      }
    } catch (error) {
      setMessage("An error occurred during login")
      setAlertSeverity('error')
      setShowAlert(true)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true // Change this to true
      });
      
    } catch (error) {
      setMessage("An error occurred during Google sign in");
      setAlertSeverity('error');
      setShowAlert(true);
    }
  };

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [showAlert])

  return (
    <div className="relative">
      <div className='w-full 2xl:h-[1000px] lg:h-[670px] md:h-[800px] sm:h-[900px] h-[900px] pt-5 bg-black/95'>
        <div className="flex justify-center items-center">
          {showAlert && (
            <div className="fixed top-5 left-1/2 w-full transform -translate-x-1/2 z-50">
              <Alert 
                severity={alertSeverity} 
                className="w-1/4 mx-auto"
              >
                {message}
              </Alert>
            </div>
          )}
        </div>
        
        <Header />
        {/* <BackgroundBeams /> */}
        <div className="flex justify-center items-center my-12 z-50 relative">
          <div className='flex justify-between md:w-1/2 lg:w-2/5 text-white px-4'>
            <div className='w-full p-5 border border-gray-400 rounded-md bg-black/90 shadow-lg'>
              <div>
                <h1 className='text-5xl font-semibold'>Login</h1>
                <h1 className='my-3'>
                  Don't have an account? 
                  <Link href="/signup"> 
                    <span className='text-purple-300 underline hover:text-purple-400 cursor-pointer ml-1'>
                      Sign Up
                    </span> 
                  </Link>
                </h1>
              </div>

              <form onSubmit={handleLogin} className='flex flex-col mt-6'>
                <div className='w-full'>
                  <h1 className='text-white/90 mb-1'>Email</h1>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder='Email' 
                    required 
                    className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none'
                  />
                </div>
                
                <div className='w-full my-4 relative'>
                  <h1 className='text-white/90 mb-1'>Password</h1>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder='********' 
                    required 
                    className='bg-slate-800 rounded-sm py-3 px-2 w-full focus:outline-none'
                  />
                  <div 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-white/80"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <AiFillEyeInvisible size={24}  className='mt-6'/> : <AiFillEye size={24} className='mt-6' />}
                  </div>
                </div>
                
                <button 
                  type='submit' 
                  className='w-full text-lg bg-purple-900 py-1.5 rounded-sm hover:bg-purple-950 font-semibold'
                >
                  Login
                </button>
              </form>

              <div className='flex justify-center items-center my-3 text-white/90'>OR</div>

              <div className='w-full flex justify-center items-center'>
                <button 
                  onClick={handleGoogleSignIn}
                  className='w-full py-2 border border-gray-400 rounded-md flex justify-center items-center gap-1 text-white/90 hover:bg-gray-900'
                >
                  <Image 
                    src={Google} 
                    width={30} 
                    height={30} 
                    alt='Google logo'
                    className='rounded-full'  
                  />
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login