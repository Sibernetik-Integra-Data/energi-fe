from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
from datetime import datetime

output_path = Path(r'd:\Data\Private\Code\Energi\energi-fe\summary\PRD-frontend-energi-stakeholder.docx')

content = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/></w:pPr>
      <w:r><w:t>Product Requirement Document</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>
      <w:r><w:t>Frontend Energi – Stakeholder Version</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>1. Executive Summary</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Energi Frontend is a web-based operational platform designed to support field and management activities through a centralized digital experience. The solution provides access to operational dashboards, sensus records, planning workflows, operational modules, and master data management in a single environment.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>The primary objective of the product is to improve visibility, accountability, and speed of information access for teams involved in plantation operations. By consolidating core workflows into a unified interface, the application reduces reliance on fragmented processes and increases consistency of operational data.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>2. Business Objectives</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Improve operational visibility through a real-time dashboard.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Provide a reliable system for managing sensus and planning data.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Centralize access to essential master data for business continuity.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Reduce manual effort and improve data consistency across departments.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>3. Scope of Product</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>In scope:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Authentication and secure access control</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Dashboard and operational summary views</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Sensus and planning modules</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Operational workflows: cleaning, fertilization, harvest, and delivery-receipt</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Master data management for reference entities</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Out of scope:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Native mobile application</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Offline mode</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Advanced analytics and reporting beyond the current operational needs</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>4. Stakeholders and Users</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Primary users include field operators, supervisors, managers, and administrators. Each user group requires a tailored experience that balances speed, clarity, and data accuracy. Stakeholders are expected to use the system for daily operational oversight, decision-making, and reference data governance.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>5. Functional Requirements</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>1. Users must be able to authenticate securely and maintain a valid session.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>2. Users must be able to access a navigable dashboard with summary information.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>3. Users must be able to view and manage sensus-related records.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>4. Users must be able to access planning data and related workflow information.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>5. Users must be able to access operational modules for core plantation activities.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>6. Users must be able to manage key master data references.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>6. Non-Functional Requirements</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Security: all protected routes must enforce authentication and secure token handling.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Performance: core pages should load quickly and respond smoothly under normal usage.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Usability: the interface should be intuitive and suitable for operational users.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Reliability: the system should provide clear feedback when data or APIs are unavailable.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Accessibility: the application should support responsive layouts and accessible interaction patterns.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>7. Technical Context</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>The frontend is implemented using Vue 3 with Vite, Pinia for state management, Vue Router for navigation, Tailwind CSS for styling, and ApexCharts for chart-based visualization. It integrates with a backend API and Keycloak for authentication, while sidebar navigation can also be sourced from a CMS-backed structure.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>8. Implementation Phases</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Phase 1: Stabilize authentication, navigation, dashboard, and sensus modules.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Phase 2: Expand planning and operational workflows with improved usability.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Phase 3: Improve performance, error handling, and data consistency across the platform.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>9. Success Metrics</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Operational users can access key workflows without confusion.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• The dashboard provides timely and actionable information.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Core data is easier to manage and maintain.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• The system reduces reliance on manual and fragmented processes.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>10. Risks and Assumptions</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Risks include incomplete backend integration, inconsistent data structures, or changing business requirements. Assumptions include stable access to relevant APIs, availability of authenticated users, and continued stakeholder alignment on feature priorities.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>11. Approval</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>This document serves as a baseline reference for product development and stakeholder alignment. Final scope and prioritization should be confirmed by product owner and engineering leads.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Generated on {}</w:t></w:r></w:p>

    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>'''.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

parts = {
    '[Content_Types].xml': '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>''',
    '_rels/.rels': '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>''',
    'docProps/core.xml': '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Product Requirement Document - Frontend Energi</dc:title>
  <dc:creator>GitHub Copilot</dc:creator>
  <cp:lastModifiedBy>GitHub Copilot</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-08-11T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-11T00:00:00Z</dcterms:modified>
</cp:coreProperties>''',
    'docProps/app.xml': '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Word</Application>
</Properties>''',
    'word/document.xml': content,
}

with ZipFile(output_path, 'w', ZIP_DEFLATED) as z:
    for name, xml in parts.items():
        z.writestr(name, xml)

print(f'Created {output_path}')
