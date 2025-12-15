export const APP_ICONS = {
    // Navigation & UI
    menu: 'heroSquares2x2Solid',
    dropdown: 'heroChevronDownSolid',
    search: 'heroMagnifyingGlassSolid',
    settings: 'heroCog6ToothSolid',
    home: 'heroHomeSolid',
    user: 'heroUserSolid',
    users: 'heroUsersSolid',
    logout: 'heroArrowRightOnRectangleSolid',
    themeSun: 'heroSunSolid',
    themeMoon: 'heroMoonSolid',
    location: 'heroMapPinSolid',
    warehouse: 'heroBuildingOffice2Solid',

    // Actions
    add: 'heroPlusSolid',
    edit: 'heroPencilSquareSolid',
    delete: 'heroTrashSolid',
    refresh: 'heroArrowPathSolid',
    upload: 'heroArrowUpTraySolid',
    download: 'heroArrowDownTraySolid',
    save: 'heroCheckSolid',
    cancel: 'heroXMarkSolid',
    back: 'heroArrowLeftSolid',
    subtract: 'heroMinusSolid',
    list: 'heroClipboardDocumentListSolid',

    // Feedback
    loading: 'heroArrowPathSolid',
    success: 'heroCheckCircleSolid',
    warning: 'heroExclamationTriangleSolid',
    error: 'heroExclamationCircleSolid',
    empty: 'heroCubeTransparent',
    default: 'heroCubeSolid',

    // Modules
    dashboard: 'heroSquares2x2Solid',
    production: 'heroBuildingOffice2Solid',
    inventory: 'heroArchiveBoxSolid',
    marketplace: 'heroBuildingStorefrontSolid',
    purchases: 'heroShoppingCartSolid',
    sales: 'heroBanknotesSolid',
    pos: 'heroCurrencyDollarSolid',
    logistics: 'heroTruckSolid',
    wholesale: 'heroBriefcaseSolid',
    documents: 'heroDocumentTextSolid',
    stats: 'heroChartBarSolid',

    // Misc / Legacy Mappings
    money: 'heroCurrencyDollarSolid',
    chartLine: 'heroPresentationChartLineSolid',
    clipboard: 'heroClipboardSolid',
    calendar: 'heroCalendarSolid',
    pieChart: 'heroChartPieSolid',
    box: 'heroArchiveBoxSolid',
    factory: 'heroBuildingOffice2Solid',
    store: 'heroBuildingStorefrontSolid',
    truck: 'heroTruckSolid',
    trendingUp: 'heroArrowTrendingUpSolid',
    trendingDown: 'heroArrowTrendingDownSolid',
    up: 'heroChevronUpSolid',
    down: 'heroChevronDownSolid'
} as const;

export type AppIconName = keyof typeof APP_ICONS;

/**
 * Helper to get an icon by name with fallback.
 * Can accept legacy names or direct AppIcon keys.
 */
export function getAppIcon(name: string | undefined | null): string {
    if (!name) return APP_ICONS.default;

    // Direct match in our keys
    if (name in APP_ICONS) {
        return APP_ICONS[name as AppIconName];
    }

    // Handle specific legacy overrides not in the main map keys if needed
    // or simple pass-through if it looks like a hero icon already
    if (name.startsWith('hero')) return name;

    // Legacy lucide mappings handled by looking up valid keys above? 
    // We added 'box', 'factory', etc to the object.
    // Add more specific legacy cases if they don't match keys exactly.
    if (name === 'dollar-sign') return APP_ICONS.money;
    if (name === 'shopping-cart') return APP_ICONS.purchases;
    if (name === 'file-text') return APP_ICONS.documents;
    if (name === 'bar-chart-2') return APP_ICONS.stats;
    if (name === 'activity') return APP_ICONS.chartLine;
    if (name === 'edit-3') return APP_ICONS.edit;

    return APP_ICONS.default;
}
