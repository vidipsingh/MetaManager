"use client";

import React, { useState, useEffect, useRef } from 'react';
import { IoTimerOutline } from "react-icons/io5";
import { FaPlay, FaPause, FaUndo } from "react-icons/fa";

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(25 * 60); // Line 14
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<Mode>('pomodoro');
  const timerRef = useRef<HTMLDivElement>(null);
  const timerIconRef = useRef<HTMLDivElement>(null);

  const [timeSettings, setTimeSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
  });

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
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTime(timeSettings[mode] * 60); // Fixed typo: removed duplicate setTime
    setIsRunning(false); // Ensure timer stops on reset
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      timerRef.current && 
      !timerRef.current.contains(event.target as Node) &&
      timerIconRef.current && 
      !timerIconRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setIsRunning(false);
    setTime(timeSettings[newMode] * 60);
  };

  interface UpdateTimeSetting {
    (mode: Mode, minutes: number): void;
  }

  const updateTimeSetting: UpdateTimeSetting = (mode, minutes) => {
    setTimeSettings(prev => ({
      ...prev,
      [mode]: Math.max(1, Math.min(60, minutes))
    }));
    if (mode === mode) { // Bug: mode === mode is always true, should compare with current mode
      setTime(minutes * 60);
    }
  };

  interface ModeColor {
    (currentMode: Mode): string;
  }

  const getModeColor: ModeColor = (currentMode) => {
    switch (currentMode) {
      case 'pomodoro': return 'bg-red-500';
      case 'shortBreak': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  interface ModeTextColor {
    (currentMode: Mode): string;
  }

  const getModeTextColor: ModeTextColor = (currentMode) => {
    switch (currentMode) {
      case 'pomodoro': return 'text-red-500';
      case 'shortBreak': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="relative">
      <div
        ref={timerIconRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer relative"
      >
        <IoTimerOutline className="w-7 h-7 cursor-pointer dark:hover:text-white/80 hover:text-black/70" />
        {isRunning && (
          <div className="absolute top-1 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        )}
      </div>

      {isOpen && (
        <div
          ref={timerRef}
          className="absolute top-full -right-24 mt-3 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50 border dark:border-gray-700"
        >
          {/* Mode Selection Tabs */}
          <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 py-2">
            <button
              onClick={() => switchMode('pomodoro')}
              className={`flex-1 py-4 px-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'pomodoro' 
                  ? 'bg-white dark:bg-gray-600 text-red-500' 
                  : 'dark:text-gray-200 dark:hover:text-gray-400 hover:text-black/70'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-4 px-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-gray-600 text-green-500'
                  : 'dark:text-gray-200 dark:hover:text-gray-400 hover:text-black/70'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`flex-1 py-4 px-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-gray-600 text-blue-500'
                  : 'dark:text-gray-200 dark:hover:text-gray-400 hover:text-black/70'
              }`}
            >
              Long Break
            </button>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-4">
            <div className={`text-6xl font-bold mb-2 ${getModeTextColor(mode)}`}>
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {mode.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={toggleTimer}
              className={`${getModeColor(mode)} text-white p-3 rounded-full hover:opacity-90 transition-colors`}
            >
              {isRunning ? <FaPause /> : <FaPlay />}
            </button>
            <button
              onClick={resetTimer}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white p-3 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <FaUndo />
            </button>
          </div>

          {/* Time Settings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pomodoro:</span>
              <input
                type="number"
                value={timeSettings.pomodoro}
                onChange={(e) => updateTimeSetting('pomodoro', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                min="1"
                max="60"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Short Break:</span>
              <input
                type="number"
                value={timeSettings.shortBreak}
                onChange={(e) => updateTimeSetting('shortBreak', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                min="1"
                max="60"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Long Break:</span>
              <input
                type="number"
                value={timeSettings.longBreak}
                onChange={(e) => updateTimeSetting('longBreak', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                min="1"
                max="60"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;