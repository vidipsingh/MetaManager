import React, { useState, useEffect, useRef } from 'react';
import { IoTimerOutline } from "react-icons/io5";
import { FaPlay, FaPause, FaUndo } from "react-icons/fa";

const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(25 * 60); 
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); 
  const timerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, time]);

  const handleTimerComplete = () => {
    setIsRunning(false);

    if (mode === 'work') {
      // Switch to short break after work session
      setMode('break');
      setTime(5 * 60); // 5-minute break
    } else if (mode === 'break') {
      // Switch back to work mode
      setMode('work');
      setTime(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMode('work');
    setTime(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (timerRef.current && !timerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer relative"
      >
        <IoTimerOutline className='w-7 h-7 cursor-pointer hover:text-black/60'/>
        {isRunning && (
          <div className="absolute top-1 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
        )}
      </div>

      {isOpen && (
        <div
          ref={timerRef} // Reference to the timer container
          className="absolute top-full -right-24 mt-3 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50 border dark:border-gray-700"
        >
          <div className="text-center mb-4">
            <div
              className={`text-4xl font-bold mb-2 ${
                mode === 'work'
                  ? 'text-red-500'
                  : 'text-green-500'
              }`}
            >
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {mode} Session
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleTimer}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              {isRunning ? <FaPause /> : <FaPlay />}
            </button>
            <button
              onClick={resetTimer}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <FaUndo />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
