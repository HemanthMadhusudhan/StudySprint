import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedProps {
  children?: React.ReactNode;
  className?: string;
}

interface FadeInProps extends AnimatedProps {
  delay?: number;
}

export const BookLogo: React.FC = () => (
  <motion.div
    whileHover={{ rotate: 10, scale: 1.1 }}
    className="text-indigo-600 mr-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  </motion.div>
);

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerContainer: React.FC<AnimatedProps> = ({ children, className = "" }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<AnimatedProps> = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0 }
    }}
    className={className}
  >
    {children}
  </motion.div>
);