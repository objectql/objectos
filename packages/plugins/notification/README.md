# @objectos/plugin-notification

Multi-channel notification dispatch center.

## Overview

Centralizes all outbound communication from ObjectOS. Whether it's a System Alert, a Workflow Approval Request, or a Marketing Blast, the Notification plugin handles the routing and rendering.

## Features

- ✅ **Channels**:
  - **Email**: SMTP / SendGrid / Amazon SES.
  - **SMS**: Twilio / Aliyun.
  - **Webhook**: Post generic JSON to external URLs (Slack/Teams).
  - **In-App**: Store notifications in the database for the UI notification bell.
- ✅ **Templates**: Handlebars/Mustache support for dynamic content.
- ✅ **User Preferences**: Respects user's "Do Not Disturb" settings and channel preferences.

## Usage

```typescript
import { NotificationPlugin } from '@objectos/plugin-notification';

await NotificationPlugin.send({
  to: user.id,
  channel: ['email', 'in-app'],
  template: 'welcome',
  data: { name: 'Steedos' }
});
```

## Development Plan

- [ ] **Template Manager**: UI for creating and editing notification properties.
- [ ] **Digest Mode**: Combine multiple notifications into one daily email.
- [ ] **Interactive Notifications**: Actionable buttons in emails (e.g., "Approve" directly from email).
- [ ] **WhatsApp/WeChat Integration**: Add social message drivers.
