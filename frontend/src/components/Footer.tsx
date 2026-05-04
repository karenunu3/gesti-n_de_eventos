
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-istpet-blue text-white py-10 mt-auto border-t-4 border-istpet-gold">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Información Principal */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl">
              <img src="https://institutotraversari.edu.ec/wp-content/uploads/2025/04/dorado-blanco.png" alt="Logo ISTPET" className="h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          </div>
          <p className="text-sm opacity-80 max-w-xs">
            Formamos profesionales competitivos, creativos, íntegros y con valores, con elevado nivel académico.
          </p>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h4 className="font-bold text-istpet-gold text-lg mb-4">Contáctanos</h4>
          <ul className="space-y-3 text-sm opacity-90">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="shrink-0 text-istpet-gold" />
              <div>
                <p>Av. Matilde Álvarez y Hugo Díaz Romero. Sector Chillogallo</p>
                <a
                  href="https://www.google.com/maps/place/Tecnol%C3%B3gico+Traversari+-+ISTPET/@-0.2824216,-78.5581015,17z/data=!3m1!4b1!4m6!3m5!1s0x91d5992d39598159:0x811c943430fab4fc!8m2!3d-0.2824216!4d-78.5555266!16s%2Fg%2F11q8xdv_v8?entry=ttu&g_ep=EgoyMDI2MDQyNi4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-istpet-gold hover:underline mt-1 inline-block"
                >
                  Ver en Google Maps
                </a>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-istpet-gold" />
              <p>02 303 2894 / 098 4033166</p>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-istpet-gold" />
              <p>admisiones@istpet.edu.ec</p>
            </li>
          </ul>
        </div>

        {/* Redes Sociales */}
        <div className="space-y-4">
          <h4 className="font-bold text-istpet-gold text-lg mb-4">Síguenos</h4>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/institutotraversari" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="https://www.instagram.com/tecnologico_traversari/" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.tiktok.com/@tecnologico_traversari" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
            <a href="https://www.youtube.com/@tecnologico_traversari" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-3 rounded-full hover:bg-istpet-gold hover:text-istpet-blue transition-colors flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>

      </div>
      <div className="max-w-7xl mx-auto px-8 mt-10 pt-6 border-t border-white/10 text-center text-xs opacity-60">
        &copy; {new Date().getFullYear()} Instituto Superior Tecnológico "Mayor Pedro Traversari". Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
