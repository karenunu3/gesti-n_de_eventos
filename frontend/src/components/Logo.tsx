import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'standard' | 'light';
}

const Logo: React.FC<LogoProps> = ({ variant = 'standard', className = '', ...props }) => {
  return (
    <img
      src="/logo.png"
      alt="ISTPET Tecnológico Traversari"
      className={`object-contain transition-all ${variant === 'light' ? 'brightness-0 invert' : ''} ${className}`}
      {...props}
    />
  );
};

export default Logo;
