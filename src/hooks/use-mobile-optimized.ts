import { useEffect, useState, useCallback } from 'react';
import type { Transition } from 'framer-motion';

/**
 * Mobile-optimized hook to detect viewport size and reduce animations on low-end devices
 */
export function useMobileOptimized() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  });

  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isLowEndDevice, setIsLowEndDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    const deviceMemory = (navigator as any).deviceMemory;
    return Boolean(deviceMemory && deviceMemory < 4);
  });

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    motionQuery.addEventListener('change', handleMotionChange);

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkViewport, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
      clearTimeout(timeoutId);
    };
  }, []);

  // Animation duration based on device capabilities
  const animationDuration = useCallback(() => {
    if (reduceMotion) return 0;
    if (isLowEndDevice) return 200;
    return 300;
  }, [reduceMotion, isLowEndDevice]);

  // Transition values for framer-motion
  const getTransitionConfig = useCallback((): Transition => {
    if (reduceMotion) {
      return { duration: 0 };
    }
    if (isLowEndDevice) {
      return { duration: 0.15, ease: 'linear' as const };
    }
    return { duration: 0.2, ease: 'easeOut' as const };
  }, [reduceMotion, isLowEndDevice]);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    reduceMotion,
    isLowEndDevice,
    animationDuration: animationDuration(),
    transitionConfig: getTransitionConfig(),
  };
}
