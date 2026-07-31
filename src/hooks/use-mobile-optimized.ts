import { useEffect, useState, useCallback } from 'react';

/**
 * Mobile-optimized hook to detect viewport size and reduce animations on low-end devices
 */
export function useMobileOptimized() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(motionQuery.matches);

    // Detect low-end devices based on memory and processor
    const deviceMemory = (navigator as any).deviceMemory;
    const isLowEnd = deviceMemory && deviceMemory < 4;
    setIsLowEndDevice(isLowEnd || false);

    // Initial viewport check
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkViewport();

    // Listen for motion preference changes
    motionQuery.addEventListener('change', (e) => setReduceMotion(e.matches));

    // Listen for viewport changes with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkViewport, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', (e) => setReduceMotion(e.matches));
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
  const getTransitionConfig = useCallback(() => {
    if (reduceMotion) {
      return { duration: 0 };
    }
    if (isLowEndDevice) {
      return { duration: 0.15, ease: 'linear' };
    }
    return { duration: 0.2, ease: 'easeOut' };
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
