# @objectos/plugin-automation

No-Code Automation Engine for ObjectOS.

## Overview

The "IF This THEN That" engine for business objects. It allows administrators to define logic without writing code.

## Features

- ✅ **Triggers**:
  - `on_create`, `on_update`, `on_delete`.
  - `schedule` (Time-based).
  - `webhook` (External trigger).
- ✅ **Conditions**: Filter logic (`amount > 1000` AND `status == 'pending'`).
- ✅ **Actions**:
  - `field_update`: Modify the record.
  - `create_record`: Create related records.
  - `script`: Run a safe JavaScript sandbox script.
  - `webhook`: Call external API.
- ✅ **Formulas**: Spreadsheet-like formula engine for calculated fields.

## Usage (Manifest)

```yaml
automations:
  - name: "Big Deal Alert"
    object: "c_opportunity"
    trigger: "on_create"
    condition: "amount > 100000"
    actions:
      - type: "notification"
        params:
          template: "big_deal_alert"
          to: "manager"
```

## Development Plan

- [ ] **Graphical Editor**: Drag-and-drop flow builder.
- [ ] **Formula Engine Upgrade**: Support cross-object formulas (`account.owner.name`).
- [ ] **Debug Mode**: Trace execution of automation rules for troubleshooting.
- [ ] **Loop Actions**: Iterate over child records (e.g., "Update all Order Items").
