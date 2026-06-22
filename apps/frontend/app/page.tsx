'use client';

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Utensils, ArrowRight, Coffee, ShoppingBag, Clock, Star, Beef, Cake, Egg, ChefHat, Sandwich, GlassWater, Cookie } from 'lucide-react';
import { motion } from 'framer-motion';

// Floating orb component for background
const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    animate={{
      y: [0, -40, 0],
      x: [0, 30, 0],
      scale: [1, 1.15, 1],
      opacity: [0.4, 0.6, 0.4],
    }}
    transition={{
      duration: 10 + delay,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  />
);

// Floating food icon component
const FloatingFood = ({
  icon: Icon,
  className,
  delay = 0,
  duration = 20,
  rotate = 0
}: {
  icon: any;
  className?: string;
  delay?: number;
  duration?: number;
  rotate?: number;
}) => (
  <motion.div
    className={`absolute ${className}`}
    animate={{
      y: [0, -120, -250],
      x: [0, 15, -15, 0],
      opacity: [0, 0.5, 0.5, 0],
      scale: [0, 1, 1, 0],
      rotate: [rotate, rotate + 10, rotate - 5, rotate],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  >
    <Icon className="w-5 h-5" strokeWidth={1.5} />
  </motion.div>
);

// Subtle wave animation overlay
const WaveBackground = () => (
  <div className="absolute inset-0 opacity-[0.4] overflow-hidden">
    <svg className="w-[200%] h-full absolute -left-1/2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <motion.path
        d="M0,100 Q200,80 400,100 T800,100 T1200,100 T1600,100 L1600,0 L0,0 Z"
        fill="url(#waveGradient)"
        animate={{
          d: [
            'M0,100 Q200,80 400,100 T800,100 T1200,100 T1600,100 L1600,0 L0,0 Z',
            'M0,100 Q200,120 400,100 T800,80 T1200,100 T1600,100 L1600,0 L0,0 Z',
            'M0,100 Q200,80 400,100 T800,100 T1200,100 T1600,100 L1600,0 L0,0 Z',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
    <svg className="w-[200%] h-full absolute -left-1/2 bottom-0" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <motion.path
        d="M0,0 Q200,20 400,0 T800,0 T1200,0 T1600,0 L1600,100 L0,100 Z"
        fill="url(#waveGradient2)"
        animate={{
          d: [
            'M0,0 Q200,20 400,0 T800,0 T1200,0 T1600,0 L1600,100 L0,100 Z',
            'M0,0 Q200,-20 400,0 T800,20 T1200,0 T1600,0 L1600,100 L0,100 Z',
            'M0,0 Q200,20 400,0 T800,0 T1200,0 T1600,0 L1600,100 L0,100 Z',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <defs>
        <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-orange-100 via-amber-100 to-rose-100 relative overflow-hidden">
      {/* Animated background layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Wave animation */}
        <WaveBackground />

        {/* Large floating orbs */}
        <FloatingOrb className="w-[500px] h-[500px] bg-gradient-to-br from-orange-400/40 to-amber-400/40 -top-60 -right-60" delay={0} />
        <FloatingOrb className="w-[400px] h-[400px] bg-gradient-to-br from-amber-400/35 to-rose-400/35 top-1/2 -left-48" delay={1.5} />
        <FloatingOrb className="w-[350px] h-[350px] bg-gradient-to-br from-rose-400/30 to-orange-400/30 bottom-20 right-1/3" delay={0.8} />

        {/* Floating food icons - more particles for richness */}
        <FloatingFood icon={Coffee} className="text-orange-400/45 left-[5%] bottom-[10%]" delay={0} duration={17} rotate={15} />
        <FloatingFood icon={ShoppingBag} className="text-amber-400/35 left-[15%] bottom-[20%]" delay={4} duration={21} rotate={-10} />
        <FloatingFood icon={Clock} className="text-rose-400/40 left-[80%] top-[15%]" delay={1} duration={19} rotate={20} />
        <FloatingFood icon={Beef} className="text-orange-400/35 left-[60%] top-[30%]" delay={5} duration={23} rotate={-15} />
        <FloatingFood icon={Egg} className="text-amber-400/40 left-[10%] top-[50%]" delay={2} duration={18} rotate={10} />
        <FloatingFood icon={Cake} className="text-rose-400/35 left-[75%] bottom-[15%]" delay={6} duration={20} rotate={-20} />
        <FloatingFood icon={Star} className="text-orange-400/40 left-[30%] top-[20%]" delay={1.5} duration={22} rotate={5} />
        <FloatingFood icon={Coffee} className="text-amber-400/45 left-[85%] bottom-[25%]" delay={3.5} duration={19} rotate={-5} />
        <FloatingFood icon={ChefHat} className="text-orange-400/35 left-[45%] bottom-[12%]" delay={0.5} duration={24} rotate={25} />
        <FloatingFood icon={Sandwich} className="text-amber-400/40 left-[25%] top-[45%]" delay={2.5} duration={18} rotate={-12} />
        <FloatingFood icon={GlassWater} className="text-rose-400/35 left-[70%] top-[25%]" delay={4.5} duration={21} rotate={8} />
        <FloatingFood icon={Cookie} className="text-orange-400/40 left-[55%] bottom-[18%]" delay={3} duration={20} rotate={-18} />
        <FloatingFood icon={Egg} className="text-amber-400/35 left-[20%] top-[35%]" delay={5.5} duration={23} rotate={12} />
        <FloatingFood icon={Cake} className="text-rose-400/40 left-[40%] top-[15%]" delay={1} duration={19} rotate={-8} />
        <FloatingFood icon={Coffee} className="text-orange-400/35 left-[90%] top-[40%]" delay={6.5} duration={22} rotate={18} />
        <FloatingFood icon={ShoppingBag} className="text-amber-400/45 left-[5%] top-[25%]" delay={0.8} duration={18} rotate={-22} />
        <FloatingFood icon={Beef} className="text-rose-400/40 left-[65%] bottom-[22%]" delay={2.2} duration={21} rotate={6} />
        <FloatingFood icon={Star} className="text-orange-400/35 left-[35%] bottom-[28%]" delay={4.2} duration={20} rotate={-14} />
        <FloatingFood icon={ChefHat} className="text-amber-400/40 left-[78%] top-[12%]" delay={0.3} duration={24} rotate={16} />
        <FloatingFood icon={Sandwich} className="text-rose-400/35 left-[50%] top-[38%]" delay={3.8} duration={19} rotate={-6} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
        className="border-b border-orange-200/40 bg-white/40 backdrop-blur-xl shadow-sm z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-gradient-to-br from-orange-600 to-amber-500 p-1.5 rounded-xl shadow-lg shadow-orange-500/30">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                FoodHub
              </span>
            </motion.div>

            <div className="flex items-center gap-3">
              <Link href="/customer">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-400 hover:bg-orange-200/50 text-orange-700 transition-all font-medium bg-white/30 backdrop-blur-sm"
                >
                  Order Food
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-700 hover:bg-orange-200/30 transition-all font-medium"
                >
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - centered in viewport */}
      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-200/70 to-amber-200/70 border border-orange-300/50 backdrop-blur-md mb-8"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-orange-800">Fast & Fresh Food Delivery</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
              Delicious Food,
            </span>
            <br />
            <motion.span
              className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% auto' }}
            >
              Delivered to You
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-orange-900/80 leading-relaxed mb-10"
          >
            Order from your favorite restaurants and get fresh food delivered to your doorstep in minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/customer">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-700 hover:to-amber-600 shadow-xl shadow-orange-500/30 transition-all text-lg px-10 py-6 rounded-2xl font-semibold relative overflow-hidden group border-0"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Order Now
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    transition={{ duration: 0.3 }}
                  />
                </Button>
              </motion.div>
            </Link>

            <Link href="/customer">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-orange-400 hover:bg-orange-200/50 text-orange-800 transition-all text-lg px-10 py-6 rounded-2xl font-semibold bg-white/30 backdrop-blur-md"
                >
                  View Restaurants
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats - small, below CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-12 flex flex-wrap justify-center gap-8 text-orange-800/70 text-sm"
          >
            <span className="font-medium">500+ Restaurants</span>
            <span className="w-1 h-1 rounded-full bg-orange-500" />
            <span className="font-medium">10K+ Happy Customers</span>
            <span className="w-1 h-1 rounded-full bg-orange-500" />
            <span className="font-medium">4.9 ★ Rating</span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
