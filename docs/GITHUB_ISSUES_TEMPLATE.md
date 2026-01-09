# GitHub Issues for Airtable Implementation

This document contains issue templates that can be created from the roadmap.

---

## Phase 1: Multi-View System Foundation

### Issue Template: View Architecture Setup

**Title**: Implement View Configuration Architecture

**Labels**: `enhancement`, `phase-1`, `architecture`

**Description**:
Establish the foundation for multi-view support in ObjectQL.

**Tasks**:
- [ ] Define `ViewConfig` interface in `packages/core/src/types.ts`
- [ ] Add view metadata loader plugin in `packages/metadata/src/plugins/objectql.ts`
- [ ] Register views in metadata registry
- [ ] Create `ViewSwitcher` component in `packages/ui/src/components/ViewSwitcher.tsx`
- [ ] Add view switching logic (URL or localStorage)
- [ ] Write specification document in `docs/spec/view-definition.md`
- [ ] Add unit tests for view registry
- [ ] Add integration tests for view loading

**Acceptance Criteria**:
- Views can be defined in `.view.yml` files
- Views are loaded and registered correctly
- ViewSwitcher shows all available views for an object
- Selected view persists across page reloads

**Estimated Effort**: 1 week

---

### Issue Template: Form View Implementation

**Title**: Implement Form View for Data Collection

**Labels**: `enhancement`, `phase-1`, `form-view`

**Description**:
Create a form view that allows users to submit data through a customizable form interface.

**Tasks**:
- [ ] Create `FormView` component extending `AutoForm`
- [ ] Implement field visibility configuration
- [ ] Implement field ordering
- [ ] Add single/two-column/grid layout options
- [ ] Create form success page with customization
- [ ] Add public form URL generation
- [ ] Support anonymous submissions
- [ ] Add form validation and error handling
- [ ] Create example forms (contact, survey, registration)
- [ ] Write documentation in `docs/guide/form-view.md`
- [ ] Add tests for form submission and validation

**Acceptance Criteria**:
- Users can create forms from any object
- Fields can be shown/hidden and reordered
- Public forms can be shared via URL
- Submitted data is saved correctly
- Success page displays after submission

**Estimated Effort**: 2 weeks

---

### Issue Template: Kanban View Implementation

**Title**: Implement Kanban Board View

**Labels**: `enhancement`, `phase-1`, `kanban-view`

**Description**:
Create a kanban board view for visualizing and managing records across different statuses.

**Tasks**:
- [ ] Evaluate DnD libraries (react-beautiful-dnd, @dnd-kit/core, react-dnd)
- [ ] Create POC for selected library
- [ ] Create `KanbanView` component in `packages/ui/src/components/views/KanbanView.tsx`
- [ ] Implement column headers based on select field values
- [ ] Create draggable card components
- [ ] Implement drag-and-drop between columns
- [ ] Add column configuration (field for grouping, fields on cards)
- [ ] Implement column collapse/expand
- [ ] Add WIP limits per column (optional)
- [ ] Add color coding by field value
- [ ] Create test cases (project board, sales pipeline)
- [ ] Write documentation in `docs/guide/kanban-view.md`
- [ ] Add tests for drag-and-drop functionality

**Acceptance Criteria**:
- Kanban board displays records grouped by a select field
- Cards can be dragged between columns
- Moving cards updates the record status
- Works on desktop and mobile (touch support)
- Performance is acceptable with 100+ cards

**Estimated Effort**: 2 weeks

---

### Issue Template: Gallery View Implementation

**Title**: Implement Gallery/Card View

**Labels**: `enhancement`, `phase-1`, `gallery-view`

**Description**:
Create a gallery view for visual browsing of records with images.

**Tasks**:
- [ ] Create `GalleryView` component in `packages/ui/src/components/views/GalleryView.tsx`
- [ ] Implement responsive grid layout
- [ ] Create card component with image thumbnail
- [ ] Add click to view full record details
- [ ] Implement image field selection configuration
- [ ] Add fields to display on cards configuration
- [ ] Add card size options (small, medium, large)
- [ ] Implement lazy loading for images
- [ ] Add placeholder for missing images
- [ ] Create test cases (product catalog, team directory)
- [ ] Write documentation in `docs/guide/gallery-view.md`
- [ ] Add tests for image loading and card interactions

**Acceptance Criteria**:
- Gallery displays records in a responsive grid
- Image thumbnails load efficiently
- Cards show configured fields
- Clicking a card opens full record view
- Performance is acceptable with 50+ images

**Estimated Effort**: 1 week

---

## Phase 2: Data Interaction Enhancements

### Issue Template: Grouping and Inline Editing

**Title**: Add Grouping and Inline Editing to Grid View

**Labels**: `enhancement`, `phase-2`, `grid-view`

**Description**:
Enhance the grid view with grouping capabilities and inline cell editing.

**Tasks**:
- [ ] Extend `QueryOptions` interface with `groupBy` field
- [ ] Implement grouping in MongoDB driver (aggregation pipeline)
- [ ] Implement grouping in PostgreSQL driver (GROUP BY)
- [ ] Update `DataTable` component with group headers
- [ ] Add expand/collapse functionality for groups
- [ ] Add totals row (count, sum, avg)
- [ ] Support nested grouping (2 levels)
- [ ] Implement inline cell editing (double-click to edit)
- [ ] Add keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- [ ] Support inline editing for all field types
- [ ] Add inline validation and error display
- [ ] Implement optimistic updates
- [ ] Add tests for grouping and editing

**Acceptance Criteria**:
- Records can be grouped by one or more fields
- Groups can be collapsed/expanded
- Totals are calculated correctly
- Double-clicking a cell enables editing
- Keyboard navigation works smoothly
- Changes are saved and validated correctly

**Estimated Effort**: 2 weeks

---

### Issue Template: Bulk Operations

**Title**: Implement Bulk Record Operations

**Labels**: `enhancement`, `phase-2`, `bulk-operations`

**Description**:
Add support for selecting and performing operations on multiple records at once.

**Tasks**:
- [ ] Add checkbox column to DataTable
- [ ] Implement select all / select none
- [ ] Add select by filter option
- [ ] Create bulk delete API endpoint: `DELETE /api/:object/bulk`
- [ ] Add confirmation dialog for bulk delete
- [ ] Support soft delete in bulk operations
- [ ] Create bulk update API endpoint: `PATCH /api/:object/bulk`
- [ ] Create bulk update UI (field selector + value input)
- [ ] Add preview of changes before bulk update
- [ ] Implement bulk export to CSV
- [ ] Add progress indicators for long operations
- [ ] Add tests for bulk operations (100+ records)

**Acceptance Criteria**:
- Multiple records can be selected via checkboxes
- Bulk delete removes all selected records
- Bulk update modifies a field on all selected records
- Selected records can be exported to CSV
- Operations show progress and can be cancelled

**Estimated Effort**: 1 week

---

### Issue Template: Advanced Filtering UI

**Title**: Redesign Filter UI with Advanced Capabilities

**Labels**: `enhancement`, `phase-2`, `filtering`

**Description**:
Enhance the filtering system with a visual builder and field-type specific filters.

**Tasks**:
- [ ] Redesign `DataTableFilter` component
- [ ] Create visual filter builder UI
- [ ] Support AND/OR condition groups
- [ ] Implement field-type specific filters:
  - [ ] Text: contains, starts with, ends with, exact match
  - [ ] Number: equals, >, <, between
  - [ ] Date: is, before, after, between, relative dates
  - [ ] Select: is, is not, is any of
  - [ ] Boolean: is checked, is not checked
  - [ ] Lookup: search and select linked records
- [ ] Add save filter as view feature
- [ ] Add filter templates/presets
- [ ] Add tests for complex filter scenarios

**Acceptance Criteria**:
- Users can build complex filters visually
- Filters work correctly for all field types
- Filters can be saved and reused
- Performance is acceptable with multiple filters

**Estimated Effort**: 1 week

---

## Phase 3: Advanced Views

### Issue Template: Calendar View

**Title**: Implement Calendar View

**Labels**: `enhancement`, `phase-3`, `calendar-view`

**Description**:
Create a calendar view for displaying date-based records.

**Tasks**:
- [ ] Evaluate calendar libraries (react-big-calendar, @fullcalendar/react)
- [ ] Create POC with selected library
- [ ] Create `CalendarView` component
- [ ] Implement month/week/day view switching
- [ ] Map records to calendar events
- [ ] Support date and datetime fields
- [ ] Add event click to view/edit
- [ ] Implement drag to reschedule
- [ ] Add create event by clicking empty slot
- [ ] Add color coding by field value
- [ ] Add export to ICS format
- [ ] Create test cases (meetings, events, milestones)
- [ ] Write documentation in `docs/guide/calendar-view.md`

**Acceptance Criteria**:
- Records with date fields display on calendar
- Users can switch between month/week/day views
- Events can be dragged to different dates
- Clicking an event opens the record
- Performance is acceptable with 100+ events per month

**Estimated Effort**: 2 weeks

---

### Issue Template: Timeline View

**Title**: Implement Timeline/Gantt View

**Labels**: `enhancement`, `phase-3`, `timeline-view`

**Description**:
Create a timeline/Gantt chart view for project planning.

**Tasks**:
- [ ] Evaluate Gantt libraries (frappe-gantt, dhtmlx-gantt, react-gantt-chart)
- [ ] Create POC with selected library
- [ ] Create `TimelineView` component
- [ ] Implement horizontal timeline rendering
- [ ] Map records to timeline bars (start/end dates)
- [ ] Add zoom controls (day, week, month, quarter)
- [ ] Support dependencies between records (optional)
- [ ] Add progress field support
- [ ] Implement drag to adjust dates
- [ ] Add critical path highlighting (optional)
- [ ] Add export to PNG/PDF
- [ ] Create test cases (project timeline, roadmap)
- [ ] Write documentation in `docs/guide/timeline-view.md`

**Acceptance Criteria**:
- Records display as bars on timeline
- Timeline can be zoomed in/out
- Dates can be adjusted by dragging
- Dependencies are shown (if supported)
- Performance is acceptable with 50+ items

**Estimated Effort**: 2 weeks

---

## Phase 4: Collaboration & Extensions

### Issue Template: Comments and Activity Log

**Title**: Implement Comments and Activity Log

**Labels**: `enhancement`, `phase-4`, `collaboration`

**Description**:
Add commenting and activity tracking for records.

**Tasks**:
- [ ] Design `comments` object schema
- [ ] Create Comment API endpoints
- [ ] Create `Comment` component UI
- [ ] Implement add/edit/delete comments
- [ ] Add @mention autocomplete
- [ ] Create notification system for mentions
- [ ] Design activity log schema
- [ ] Implement activity tracking for all CRUD operations
- [ ] Create ActivityLog component
- [ ] Add filtering by action type
- [ ] Add email notifications (optional)
- [ ] Add tests for commenting and activity log

**Acceptance Criteria**:
- Users can comment on records
- @mentions notify users
- All record changes are logged
- Activity log can be filtered
- Comments and activity are displayed in chronological order

**Estimated Effort**: 2 weeks

---

### Issue Template: Import/Export

**Title**: Implement CSV/Excel Import and Export

**Labels**: `enhancement`, `phase-4`, `import-export`

**Description**:
Add data import and export capabilities.

**Tasks**:
- [ ] Create CSV importer in `packages/api/src/import-export/csv-importer.ts`
- [ ] Integrate `papaparse` library
- [ ] Create field mapping UI
- [ ] Implement data validation
- [ ] Add import preview
- [ ] Create background job queue for large imports
- [ ] Create CSV exporter
- [ ] Add field selection for export
- [ ] Support filtering before export
- [ ] Add Excel support with `xlsx` library (optional)
- [ ] Create API endpoints: `POST /api/:object/import`, `GET /api/:object/export`
- [ ] Create import wizard UI
- [ ] Add tests for import/export with 10k+ records

**Acceptance Criteria**:
- CSV files can be imported with field mapping
- Large imports (10k+ records) work reliably
- Data validation prevents bad imports
- Records can be exported to CSV with selected fields
- Excel import/export works (if implemented)

**Estimated Effort**: 2 weeks

---

### Issue Template: Real-time Sync

**Title**: Implement Real-time Data Synchronization

**Labels**: `enhancement`, `phase-4`, `real-time`

**Description**:
Add WebSocket-based real-time synchronization for multi-user collaboration.

**Tasks**:
- [ ] Setup WebSocket gateway in `packages/server/src/realtime/gateway.ts`
- [ ] Integrate `socket.io` library
- [ ] Implement change event broadcasting
- [ ] Create room-based subscriptions (per object)
- [ ] Create `useRealtimeSync` hook in `packages/ui`
- [ ] Implement optimistic updates
- [ ] Add conflict resolution (last-write-wins)
- [ ] Add presence system (online users)
- [ ] Display user avatars for active viewers
- [ ] Add reconnection logic
- [ ] Add tests for multi-user scenarios

**Acceptance Criteria**:
- Changes made by one user appear immediately for others
- Conflicts are resolved automatically
- Connection is re-established after network interruption
- Performance is acceptable with 100+ concurrent users
- Online users are visible

**Estimated Effort**: 1 week

---

## Phase 5: UI/UX Polish

### Issue Template: Linked Record Picker and Attachments

**Title**: Enhance Linked Record and Attachment UI

**Labels**: `enhancement`, `phase-5`, `ui-components`

**Description**:
Improve the UI for selecting linked records and managing attachments.

**Tasks**:
- [ ] Create `LinkedRecordPicker` component
- [ ] Add searchable record list in modal
- [ ] Support filtering linked records
- [ ] Add preview of linked record details
- [ ] Support multiple record selection
- [ ] Improve lookup field display in grid
- [ ] Add popover with full record details
- [ ] Enable navigation to linked record
- [ ] Create `AttachmentUploader` component
- [ ] Add drag-and-drop zone
- [ ] Create `AttachmentPreview` grid
- [ ] Create `AttachmentModal` for full-screen preview
- [ ] Integrate file storage (local/S3)
- [ ] Add tests for file upload and preview

**Acceptance Criteria**:
- Linked records can be searched and selected easily
- Linked record details are visible on hover
- Multiple files can be uploaded via drag-and-drop
- Images and PDFs can be previewed
- File storage is configurable

**Estimated Effort**: 2 weeks

---

### Issue Template: Rich Field Components

**Title**: Implement Rich Text and Advanced Field Types

**Labels**: `enhancement`, `phase-5`, `field-types`

**Description**:
Add rich text editing and advanced field types (Rating, Duration, Button).

**Tasks**:
- [ ] Evaluate rich text editors (TipTap, Lexical, Slate)
- [ ] Create `RichTextField` component
- [ ] Add formatting toolbar (bold, italic, lists, links, images)
- [ ] Store content as HTML or JSON
- [ ] Create `RatingField` component (star rating)
- [ ] Support configurable max rating
- [ ] Add half-star support (optional)
- [ ] Create `DurationField` component
- [ ] Support HH:MM:SS and human-readable formats
- [ ] Create `ButtonField` component
- [ ] Add action trigger on button click
- [ ] Update field type registry
- [ ] Add tests for new field types

**Acceptance Criteria**:
- Rich text editor supports basic formatting
- Rating field displays stars and saves values
- Duration field accepts and validates time input
- Button field triggers custom actions
- All new fields work in grid and form views

**Estimated Effort**: 2 weeks

---

## Phase 6: Automation & Templates

### Issue Template: Visual Automation Builder

**Title**: Implement Visual Automation System

**Labels**: `enhancement`, `phase-6`, `automation`

**Description**:
Create a visual automation builder for workflow automation.

**Tasks**:
- [ ] Design Automation DSL (YAML format)
- [ ] Implement trigger system:
  - [ ] Record created
  - [ ] Record updated
  - [ ] Record matches conditions
  - [ ] Scheduled time (cron)
  - [ ] Manual trigger
- [ ] Implement action executors:
  - [ ] Send email
  - [ ] Create record
  - [ ] Update record
  - [ ] Run script (sandboxed JavaScript)
  - [ ] Call webhook
- [ ] Create visual workflow builder UI
- [ ] Add trigger configuration interface
- [ ] Add action configuration interface
- [ ] Implement test run functionality
- [ ] Add automation execution logs
- [ ] Add tests for automation scenarios

**Acceptance Criteria**:
- Automations can be created visually
- All trigger types work correctly
- All action types execute successfully
- Automation execution is logged
- Failed automations are retried (if configured)

**Estimated Effort**: 2 weeks

---

### Issue Template: Template System

**Title**: Implement Base Template System

**Labels**: `enhancement`, `phase-6`, `templates`

**Description**:
Create a template system for quick-start applications.

**Tasks**:
- [ ] Define template structure
- [ ] Implement template loader
- [ ] Support importing objects, views, and sample data
- [ ] Configure relationships automatically
- [ ] Create template marketplace UI
- [ ] Add template browser
- [ ] Add template preview
- [ ] Add template installation
- [ ] Build starter templates:
  - [ ] CRM (Customers, Deals, Contacts)
  - [ ] Project Management (Projects, Tasks, Time)
  - [ ] Inventory (Products, Orders, Stock)
  - [ ] Event Planning (Events, Attendees, Venues)
  - [ ] Content Calendar (Posts, Authors, Categories)
- [ ] Write template development guide
- [ ] Add tests for template installation

**Acceptance Criteria**:
- Templates can be browsed and previewed
- Templates install with all objects and views
- Sample data is loaded correctly
- Relationships are configured automatically
- 5+ production-ready templates available

**Estimated Effort**: 2 weeks

---

## Quick Wins (Can be done before Phase 1)

### Issue Template: DataTable Performance Optimization

**Title**: Optimize DataTable with Virtual Scrolling

**Labels**: `enhancement`, `performance`, `quick-win`

**Description**:
Improve DataTable performance for large datasets.

**Tasks**:
- [ ] Integrate virtual scrolling library (react-window or react-virtual)
- [ ] Update DataTable to use virtual scrolling
- [ ] Test with 1000+ records
- [ ] Benchmark performance improvements
- [ ] Update documentation

**Acceptance Criteria**:
- 1000 records render in < 2 seconds
- Scrolling is smooth
- No memory leaks

**Estimated Effort**: 2-3 days

---

### Issue Template: Enhanced Filter UI

**Title**: Improve Filter UI for Better Usability

**Labels**: `enhancement`, `ui`, `quick-win`

**Description**:
Enhance the current filter UI with field-type specific controls.

**Tasks**:
- [ ] Add date picker for date filters
- [ ] Add number input for numeric filters
- [ ] Add dropdown for select field filters
- [ ] Improve filter condition labels
- [ ] Add filter pills/chips display
- [ ] Add tests

**Acceptance Criteria**:
- Filters use appropriate input controls
- Filter UI is more intuitive
- Applied filters are clearly visible

**Estimated Effort**: 1-2 days

---

### Issue Template: Basic CSV Export

**Title**: Add Basic CSV Export Functionality

**Labels**: `enhancement`, `export`, `quick-win`

**Description**:
Add a simple CSV export button to export current view data.

**Tasks**:
- [ ] Create CSV export utility function
- [ ] Add export button to DataTable toolbar
- [ ] Export visible records with applied filters
- [ ] Respect field visibility settings
- [ ] Add filename with timestamp
- [ ] Add tests

**Acceptance Criteria**:
- Export button appears in grid toolbar
- Exported CSV matches current view
- File downloads with correct format

**Estimated Effort**: 1 day

---

### Issue Template: Improved Lookup Field Display

**Title**: Enhance Lookup Field Display in Grid

**Labels**: `enhancement`, `ui`, `quick-win`

**Description**:
Improve how lookup fields are displayed in the grid view.

**Tasks**:
- [ ] Show linked record's primary field
- [ ] Add tooltip with full record details
- [ ] Make lookup clickable to navigate to record
- [ ] Add icon indicator for lookup fields
- [ ] Add tests

**Acceptance Criteria**:
- Lookup fields show meaningful data
- Clicking navigates to linked record
- Hovering shows record details

**Estimated Effort**: 1-2 days

---

### Issue Template: Keyboard Shortcuts

**Title**: Add Keyboard Shortcuts for Common Actions

**Labels**: `enhancement`, `accessibility`, `quick-win`

**Description**:
Implement keyboard shortcuts to improve efficiency.

**Tasks**:
- [ ] Add Ctrl+Enter to save form/inline edit
- [ ] Add Escape to cancel edit
- [ ] Add Ctrl+K for command palette (future)
- [ ] Add Delete key for record deletion (with confirmation)
- [ ] Add Tab/Shift+Tab for field navigation
- [ ] Add keyboard shortcut help (? key)
- [ ] Document all shortcuts
- [ ] Add tests

**Acceptance Criteria**:
- All shortcuts work as expected
- Shortcuts are discoverable (help menu)
- Shortcuts don't conflict with browser defaults

**Estimated Effort**: 2-3 days

---

## Labels to Create in GitHub

Create these labels in your GitHub repository:
- `enhancement`
- `phase-1`
- `phase-2`
- `phase-3`
- `phase-4`
- `phase-5`
- `phase-6`
- `architecture`
- `form-view`
- `kanban-view`
- `gallery-view`
- `calendar-view`
- `timeline-view`
- `grid-view`
- `bulk-operations`
- `filtering`
- `collaboration`
- `import-export`
- `real-time`
- `ui-components`
- `field-types`
- `automation`
- `templates`
- `performance`
- `quick-win`
- `ui`
- `export`
- `accessibility`

