import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'standard' | 'light';
}

const Logo: React.FC<LogoProps> = ({ variant = 'standard', className = '', ...props }) => {
  const isLight = variant === 'light';
  
  const goldColor = '#c4a857';
  const navyColor = '#222c57';
  
  const istColor = isLight ? goldColor : navyColor;
  const petColor = goldColor;
  const rightTextColor = isLight ? '#ffffff' : navyColor;
  
  return (
    <svg 
      viewBox="0 0 540 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <style>
        {`
          .logo-text-condensed {
            font-family: 'Arial Narrow', 'Impact', 'Oswald', ui-sans-serif, system-ui, sans-serif;
            font-weight: 900;
            font-stretch: extra-condensed;
            letter-spacing: -0.03em;
          }
        `}
      </style>
      
      {/* Bloque Izquierdo: IST PET */}
      <text x="10" y="72" fill={istColor} fontSize="86" className="logo-text-condensed">IST</text>
      <text x="10" y="148" fill={petColor} fontSize="86" className="logo-text-condensed">PET</text>
      
      {/* Barra separadora vertical dorada */}
      <rect x="135" y="12" width="7" height="136" fill={goldColor} />
      
      {/* Bloque Derecho: TECNOLÓGICO TRAVERSARI */}
      <text x="155" y="72" fill={rightTextColor} fontSize="76" className="logo-text-condensed">TECNOLÓGICO</text>
      <text x="155" y="148" fill={rightTextColor} fontSize="76" className="logo-text-condensed">TRAVERSARI</text>
    </svg>
  );
};

export default Logo;
