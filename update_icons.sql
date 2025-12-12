-- SQL to update existing module icons to Heroicons Solid (compatible with @ng-icons/heroicons)
-- Run this script in your Supabase SQL Editor

-- Settings / Configuration
UPDATE modules 
SET icon = 'heroCog6ToothSolid' 
WHERE code IN ('configuration', 'settings') OR icon = 'settings';

-- Production / Manufacturing
UPDATE modules 
SET icon = 'heroBuildingOffice2Solid' 
WHERE code IN ('production', 'manufacturing') OR icon = 'factory';

-- Inventory / Supply Chain
UPDATE modules 
SET icon = 'heroArchiveBoxSolid' 
WHERE code IN ('inventory', 'supply-chain', 'scm-inventory') OR icon = 'package';

-- Marketplace
UPDATE modules 
SET icon = 'heroBuildingStorefrontSolid' 
WHERE code = 'marketplace' OR icon = 'store';

-- Human Resources
UPDATE modules 
SET icon = 'heroUsersSolid' 
WHERE code IN ('hr', 'human-resources') OR icon = 'users';

-- CRM (Customer Relationship Management)
UPDATE modules 
SET icon = 'heroUserGroupSolid' 
WHERE code = 'crm';

-- Accounting / Finance
UPDATE modules 
SET icon = 'heroCalculatorSolid' 
WHERE code IN ('accounting', 'finance') OR icon = 'calculator';

-- Sales
UPDATE modules 
SET icon = 'heroArrowTrendingUpSolid' 
WHERE code = 'sales' OR icon = 'trending-up';

-- Marketing
UPDATE modules 
SET icon = 'heroMegaphoneSolid' 
WHERE code = 'marketing' OR icon = 'megaphone';

-- Projects
UPDATE modules 
SET icon = 'heroClipboardDocumentCheckSolid' 
WHERE code IN ('projects', 'project-management') OR icon = 'clipboard-check';

-- Service / Support
UPDATE modules 
SET icon = 'heroChatBubbleLeftRightSolid' 
WHERE code IN ('support', 'service') OR icon = 'headphones';

-- Global Edit Icon (if used)
UPDATE modules 
SET icon = 'heroPencilSquareSolid' 
WHERE icon = 'edit-3';

-- Check for remaining legacy icons
-- SELECT id, name, code, icon FROM modules WHERE icon NOT LIKE 'hero%';
