"use client";

import React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import github_dp from "../../public/images/112854574.png";
import { FiGithub } from "react-icons/fi";
import { FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const Hero = () => {
  const texts = [
    "Web3 Platform for Decentralized Workflows",
    "Enhancing productivity with safe collaboration.",
    "Enabling teams with decentralized solutions.",
  ];

  const [currentText, setCurrentText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 40;
  const deletingSpeed = 40;
  const pauseDuration = 1500;
  const stopAt = 2;

  const { data: session, status } = useSession();

  useEffect(() => {
    const handleTyping = () => {
      const fullText = texts[index];

      if (isDeleting) {
        const newText = fullText.substring(0, currentText.length - 1);
        setCurrentText(newText);
        
        if (newText.length <= stopAt) {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % texts.length);
        }
      } else {
        const newText = fullText.substring(0, currentText.length + 1);
        setCurrentText(newText);
        
        if (newText === fullText) {
          setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, index]);

  return (
    <div className='mb-20'>
      <div className='text-white text-center h-60 py-5 flex flex-col items-center justify-center mt-16 sm:mt-20 mb-4'>
        <h1 className='md:text-5xl sm:text-4xl dark:text-white text-black text-3xl font-bold sm:w-1/2 w-2/3'>Decentralized Productivity Web3 Platform</h1>
        <div className='my-4'>
          <h1 className='sm:flex hidden lg:text-4xl md:text-3xl sm:text-2xl text-xl sm:py-0 px-2 sm:px-0 py-4 font-bold text-amber-400 dark:text-yellow-400'>{currentText}</h1>
        </div>
        <h1 className='sm:w-2/5 md:w-1/2 w-3/4 text-lg mt-4 text-gray-800 dark:text-gray-200'>A decentralized Web3 platform boosting productivity with secure, private, and seamless collaboration.</h1>
      </div>

      <div className='w-full text-white flex flex-col items-center justify-center text-center lg:mt-10 md:mt-14 sm:mt-16 mt-8'>
        <div className='lg:w-1/3 md:w-1/2 sm:w-1/2 w-3/4 border border-gray-600 dark:border-gray-400 p-4 rounded-md'>
          <h1 className='text-xl dark:text-white text-black font-semibold mb-3'>Welcome to MetaManager ❤️!</h1>
          <h1 className='text-base font-semibold text-gray-600 dark:text-gray-400'>MetaManager is a decentralized Web3 platform designed to enhance productivity! <br /> Get started by logging in below.</h1>

          <div className='flex justify-center gap-4 my-4 mt-5'>
            {status === "authenticated" ? (
              <Link href="/dashboard">
                <button className='dark:bg-white dark:text-black bg-black text-white hover:bg-gray-200/90 hover:text-black px-8 py-2 rounded-md shadow-md dark:hover:bg-gray-400 font-semibold'>
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className='dark:bg-white dark:text-black bg-black text-white hover:bg-gray-200 hover:text-black px-10 py-1 rounded-md shadow-md dark:hover:bg-gray-400 font-semibold'>
                    Login
                  </button>
                </Link>
                <Link href="/signup">
                  <button className='dark:bg-white dark:text-black bg-black text-white hover:bg-gray-200 hover:text-black px-10 py-1 rounded-md shadow-md font-semibold'>
                    Signup
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className='text-center my-8 flex flex-col justify-center items-center gap-6'>
        <h1 className='dark:text-white text-black text-2xl font-bold'>An App By - </h1>
        <Image src={github_dp} width={125} height={125} alt={''} className='rounded-full border-[5px] border-amber-400 dark:border-yellow-400 '  />
        <h1 className='dark:text-gray-400 text-gray-600 text-xl font-bold'>vidipsingh</h1>
      </div>

      <div className='flex justify-center gap-10 pb-2'>
        <Link href="https://github.com/vidipsingh">
          <FiGithub className='dark:text-yellow-400/80 text-amber-400 hover:text-amber-500 dark:hover:text-yellow-400 cursor-pointer h-8 w-8'/>
        </Link>
        <Link href="https://www.linkedin.com/in/vidip-singh-a0aa5b23b/">
          <FaLinkedinIn className='text-amber-400/80 hover:text-amber-500 dark:text-yellow-400/80 dark:hover:text-yellow-400 cursor-pointer h-8 w-8'/>
        </Link>
        <Link href="https://x.com/vidip2025">
          <FaXTwitter className='text-amber-400/80 hover:text-amber-500 dark:text-yellow-400/80 dark:hover:text-yellow-400 cursor-pointer h-8 w-8'/>
        </Link>
      </div>
    </div>
  );
};

export default Hero;