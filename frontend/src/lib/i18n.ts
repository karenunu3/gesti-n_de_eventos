import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "navbar.title": "ISTPET Events",
      "navbar.back": "Back to Dashboard",
      "navbar.logout": "Logout",
      
      "dashboard.welcome": "Hello, {{name}}",
      "dashboard.subtitle": "Welcome to the institutional events system.",
      "dashboard.total_hours": "Total Approved Hours",
      "dashboard.my_attendances": "My Attendances & Certificates",
      "dashboard.no_attendances": "You don't have validated attendances yet.",
      "dashboard.cert_btn": "Certificate",
      "dashboard.global_metrics": "Global Metrics",
      "dashboard.admin_events": "Manage Events",
      "dashboard.admin_careers": "Manage Careers",
      "dashboard.admin_users": "Manage Users",

      "events.title": "Institutional Events",
      "events.back": "Back",
      "events.scan_qr": "Scan QR for Attendance",
      "events.register_in": "Check-In",
      "events.register_out": "Check-Out",
      "events.enroll": "Enroll",
      "events.cancel": "Cancel",
      
      "theme.light": "Light",
      "theme.dark": "Dark",
      "theme.system": "System",
      "lang.es": "Spanish",
      "lang.en": "English"
    }
  },
  es: {
    translation: {
      "navbar.title": "ISTPET Eventos",
      "navbar.back": "Volver al Dashboard",
      "navbar.logout": "Salir",

      "dashboard.welcome": "Hola, {{name}}",
      "dashboard.subtitle": "Bienvenido al sistema de eventos institucionales.",
      "dashboard.total_hours": "Horas Totales Aprobadas",
      "dashboard.my_attendances": "Mis Asistencias y Certificados",
      "dashboard.no_attendances": "Aún no tienes asistencias validadas.",
      "dashboard.cert_btn": "Certificado",
      "dashboard.global_metrics": "Métricas Globales",
      "dashboard.admin_events": "Administrar Eventos",
      "dashboard.admin_careers": "Administrar Carreras",
      "dashboard.admin_users": "Administrar Usuarios",

      "events.title": "Eventos Institucionales",
      "events.back": "Volver",
      "events.scan_qr": "Escanear QR de Asistencia",
      "events.register_in": "Registrar Entrada (Check-In)",
      "events.register_out": "Registrar Salida (Check-Out)",
      "events.enroll": "Inscribirme",
      "events.cancel": "Cancelar",
      
      "theme.light": "Claro",
      "theme.dark": "Oscuro",
      "theme.system": "Sistema",
      "lang.es": "Español",
      "lang.en": "Inglés"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem("app_lang") || "es", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    fallbackLng: "es",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
