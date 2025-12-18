
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bupapjirkilnfoswgtsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFwamlya2lsbmZvc3dndHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMDAyMiwiZXhwIjoyMDc4OTg2MDIyfQ.AIM7H-sNU8Tf-kFXY8jLVfp-eD0H4FwCl_o5Y38JkDA';
const supabase = createClient(supabaseUrl, supabaseKey);

const modules = [
    // --- Ventas & CRM ---
    { code: 'crm', name: 'CRM', description: 'Pipeline de ventas y leads', category: 'ventas', icon: 'heroUserGroupSolid', color: '#EC4899', route_path: '/ventas/crm', price_monthly: 0, sort_order: 10 },
    { code: 'sales', name: 'Ventas', description: 'Cotizaciones y pedidos', category: 'ventas', icon: 'heroPresentationChartLineSolid', color: '#F43F5E', route_path: '/ventas/pedidos', price_monthly: 15, sort_order: 11 },
    { code: 'pos-retail', name: 'PdV Retail', description: 'Punto de venta para tiendas', category: 'ventas', icon: 'heroCalculatorSolid', color: '#F59E0B', route_path: '/ventas/pdv-retail', price_monthly: 19, sort_order: 12 },
    { code: 'pos-restaurant', name: 'PdV Restaurante', description: 'Gestión de mesas y comandas', category: 'ventas', icon: 'heroFireSolid', color: '#EF4444', route_path: '/ventas/pdv-restaurante', price_monthly: 29, sort_order: 13 },
    { code: 'subscriptions', name: 'Suscripciones', description: 'Facturación recurrente', category: 'ventas', icon: 'heroArrowPathSolid', color: '#8B5CF6', route_path: '/ventas/suscripciones', price_monthly: 25, sort_order: 14 },
    { code: 'rentals', name: 'Alquileres', description: 'Gestión de rentas', category: 'ventas', icon: 'heroKeySolid', color: '#6366F1', route_path: '/ventas/alquileres', price_monthly: 20, sort_order: 15 },

    // --- Servicios ---
    { code: 'project', name: 'Proyectos', description: 'Gestión ágil de proyectos', category: 'servicios', icon: 'heroSquares2x2Solid', color: '#3B82F6', route_path: '/servicios/proyectos', price_monthly: 10, sort_order: 20 },
    { code: 'timesheets', name: 'Hojas de Horas', description: 'Control de tiempos', category: 'servicios', icon: 'heroClockSolid', color: '#10B981', route_path: '/servicios/horas', price_monthly: 5, sort_order: 21 },
    { code: 'field-service', name: 'Servicio Externo', description: 'Gestión de técnicos en campo', category: 'servicios', icon: 'heroMapPinSolid', color: '#F59E0B', route_path: '/servicios/campo', price_monthly: 35, sort_order: 22 },
    { code: 'helpdesk', name: 'Mesa de Ayuda', description: 'Soporte al cliente', category: 'servicios', icon: 'heroLifebuoySolid', color: '#EF4444', route_path: '/servicios/soporte', price_monthly: 20, sort_order: 23 },
    { code: 'planning', name: 'Planificación', description: 'Horarios de empleados', category: 'servicios', icon: 'heroCalendarDaysSolid', color: '#06B6D4', route_path: '/servicios/planificacion', price_monthly: 15, sort_order: 24 },
    { code: 'appointments', name: 'Citas', description: 'Reservas en línea', category: 'servicios', icon: 'heroClockSolid', color: '#8B5CF6', route_path: '/servicios/citas', price_monthly: 12, sort_order: 25 },

    // --- Contabilidad & Finanzas ---
    { code: 'accounting', name: 'Contabilidad', description: 'Libro mayor y reportes', category: 'finanzas', icon: 'heroCalculatorSolid', color: '#8B5CF6', route_path: '/finanzas/contabilidad', price_monthly: 39, sort_order: 30 },
    { code: 'invoicing', name: 'Facturación', description: 'Facturación electrónica', category: 'finanzas', icon: 'heroDocumentTextSolid', color: '#3B82F6', route_path: '/finanzas/facturacion', price_monthly: 0, sort_order: 31 },
    { code: 'expenses', name: 'Gastos', description: 'Control de viáticos y gastos', category: 'finanzas', icon: 'heroCreditCardSolid', color: '#EF4444', route_path: '/finanzas/gastos', price_monthly: 9, sort_order: 32 },
    { code: 'documents', name: 'Documentos', description: 'Gestión documental digital', category: 'finanzas', icon: 'heroFolderSolid', color: '#64748B', route_path: '/finanzas/documentos', price_monthly: 15, sort_order: 33 },
    { code: 'spreadsheet', name: 'Hojas de Cálculo', description: 'Reportes dinámicos BI', category: 'finanzas', icon: 'heroTableCellsSolid', color: '#10B981', route_path: '/finanzas/reportes', price_monthly: 10, sort_order: 34 },
    { code: 'treasury', name: 'Tesorería', description: 'Caja y bancos', category: 'finanzas', icon: 'heroCurrencyDollarSolid', color: '#F59E0B', route_path: '/finanzas/tesoreria', price_monthly: 19, sort_order: 35 },

    // --- Inventario y Producción (SCM) ---
    { code: 'inventory', name: 'Inventario', description: 'Gestión de stock masiva', category: 'cadena_suministro', icon: 'heroArchiveBoxSolid', color: '#3B82F6', route_path: '/cadena-suministro/inventario', price_monthly: 0, sort_order: 40 },
    { code: 'manufacturing', name: 'Fabricación', description: 'Órdenes de producción/MRP', category: 'cadena_suministro', icon: 'heroBuildingOffice2Solid', color: '#10B981', route_path: '/cadena-suministro/manufactura', price_monthly: 49, sort_order: 41 },
    { code: 'purchasing', name: 'Compras', description: 'Proveedores y licitaciones', category: 'cadena_suministro', icon: 'heroShoppingCartSolid', color: '#EF4444', route_path: '/cadena-suministro/compras', price_monthly: 29, sort_order: 42 },
    { code: 'maintenance', name: 'Mantenimiento', description: 'Mantenimiento de activos', category: 'cadena_suministro', icon: 'heroWrenchScrewdriverSolid', color: '#F59E0B', route_path: '/cadena-suministro/mantenimiento', price_monthly: 19, sort_order: 43 },
    { code: 'quality-control', name: 'Calidad', description: 'Control y auditorías', category: 'cadena_suministro', icon: 'heroShieldCheckSolid', color: '#06B6D4', route_path: '/cadena-suministro/calidad', price_monthly: 25, sort_order: 44 },
    { code: 'plm', name: 'PLM', description: 'Ciclo de vida de producto', category: 'cadena_suministro', icon: 'heroCpuChipSolid', color: '#6366F1', route_path: '/cadena-suministro/plm', price_monthly: 35, sort_order: 45 },

    // --- Recursos Humanos ---
    { code: 'hr-employees', name: 'Empleados', description: 'Directorio y perfiles', category: 'rrhh', icon: 'heroUsersSolid', color: '#10B981', route_path: '/rrhh/empleados', price_monthly: 0, sort_order: 50 },
    { code: 'recruitment', name: 'Reclutamiento', description: 'Bolsa de trabajo y selección', category: 'rrhh', icon: 'heroBriefcaseSolid', color: '#3B82F6', route_path: '/rrhh/reclutamiento', price_monthly: 25, sort_order: 51 },
    { code: 'time-off', name: 'Ausencias', description: 'Vacaciones y permisos', category: 'rrhh', icon: 'heroSunSolid', color: '#F59E0B', route_path: '/rrhh/vacaciones', price_monthly: 10, sort_order: 52 },
    { code: 'appraisals', name: 'Evaluaciones', description: 'Desempeño y feedback', category: 'rrhh', icon: 'heroStarSolid', color: '#8B5CF6', route_path: '/rrhh/evaluaciones', price_monthly: 15, sort_order: 53 },
    { code: 'payroll', name: 'Nómina', description: 'Cálculo de sueldos y leyes', category: 'rrhh', icon: 'heroCurrencyDollarSolid', color: '#10B981', route_path: '/rrhh/nomina', price_monthly: 39, sort_order: 54 },
    { code: 'fleet', name: 'Flota', description: 'Vehículos y combustible', category: 'rrhh', icon: 'heroTruckSolid', color: '#64748B', route_path: '/rrhh/flota', price_monthly: 20, sort_order: 55 },

    // --- Marketing ---
    { code: 'marketing-automation', name: 'Automatización', description: 'Campañas multicanal', category: 'marketing', icon: 'heroBoltSolid', color: '#F43F5E', route_path: '/marketing/automation', price_monthly: 45, sort_order: 60 },
    { code: 'email-marketing', name: 'Email Marketing', description: 'Newsletter y envíos masivos', category: 'marketing', icon: 'heroEnvelopeSolid', color: '#3B82F6', route_path: '/marketing/email', price_monthly: 15, sort_order: 61 },
    { code: 'social-marketing', name: 'Redes Sociales', description: 'Publicación coordinada', category: 'marketing', icon: 'heroShareSolid', color: '#06B6D4', route_path: '/marketing/social', price_monthly: 20, sort_order: 62 },
    { code: 'events', name: 'Eventos', description: 'Tickets y organización', category: 'marketing', icon: 'heroTicketSolid', color: '#F59E0B', route_path: '/marketing/eventos', price_monthly: 29, sort_order: 63 },
    { code: 'surveys', name: 'Encuestas', description: 'NPS y satisfacción', category: 'marketing', icon: 'heroClipboardDocumentCheckSolid', color: '#8B5CF6', route_path: '/marketing/encuestas', price_monthly: 10, sort_order: 64 },

    // --- Sitio Web & Ecommerce ---
    { code: 'website', name: 'Sitio Web', description: 'Constructor visual (CMS)', category: 'web', icon: 'heroGlobeAltSolid', color: '#6366F1', route_path: '/web/site', price_monthly: 0, sort_order: 70 },
    { code: 'ecommerce', name: 'Tienda Online', description: 'Venta 24/7 integrado', category: 'web', icon: 'heroShoppingBagSolid', color: '#3B82F6', route_path: '/web/ecommerce', price_monthly: 35, sort_order: 71 },
    { code: 'blog', name: 'Blog', description: 'Contenido y SEO', category: 'web', icon: 'heroNewspaperSolid', color: '#F43F5E', route_path: '/web/blog', price_monthly: 9, sort_order: 72 },
    { code: 'elearning', name: 'eLearning', description: 'Cursos y capacitación', category: 'web', icon: 'heroAcademicCapSolid', color: '#10B981', route_path: '/web/learning', price_monthly: 49, sort_order: 73 },
    { code: 'forum', name: 'Foro', description: 'Comunidad y preguntas', category: 'web', icon: 'heroChatBubbleLeftRightSolid', color: '#8B5CF6', route_path: '/web/forum', price_monthly: 12, sort_order: 74 },

    // --- Productividad ---
    { code: 'contacts', name: 'Contactos', description: 'Libreta de direcciones centralizada', category: 'productividad', icon: 'heroIdentificationSolid', color: '#64748B', route_path: '/productividad/contactos', price_monthly: 0, sort_order: 80 },
    { code: 'calendar', name: 'Calendario', description: 'Agenda compartida', category: 'productividad', icon: 'heroCalendarSolid', color: '#3B82F6', route_path: '/productividad/calendario', price_monthly: 0, sort_order: 81 },
    { code: 'notes', name: 'Notas', description: 'Captura rápida de ideas', category: 'productividad', icon: 'heroLightBulbSolid', color: '#F59E0B', route_path: '/productividad/notas', price_monthly: 5, sort_order: 82 },
    { code: 'discussions', name: 'Chat', description: 'Comunicación interna', category: 'productividad', icon: 'heroChatBubbleOvalLeftEllipsisSolid', color: '#10B981', route_path: '/productividad/chat', price_monthly: 0, sort_order: 83 }
];

async function seed() {
    console.log(`Seeding multiservice catalog (${modules.length} modules)...`);

    // Borrar anteriores para evitar duplicados si cambiaron algunos códigos (opcional, mejor upsert)
    const { data, error } = await supabase
        .from('modules')
        .upsert(modules, { onConflict: 'code' });

    if (error) {
        console.error('Error seeding modules:', error.message);
    } else {
        console.log('Successfully seeded all 40+ modules.');
    }
}

seed();
