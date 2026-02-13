# @objectos/plugin-i18n

A lightweight internationalization and localization plugin for ObjectOS. Provides complete translation management, variable interpolation, pluralization, and locale-aware number/date formatting.

## Features

- 🌍 **Multi-locale Support** - Manage translations for any number of locales
- 🔄 **Dynamic Locale Switching** - Change locales at runtime
- 📦 **Nested Keys** - Organize translations with dot notation (`user.profile.name`)
- 🔤 **Variable Interpolation** - Replace `{{variable}}` placeholders in translations
- 🔢 **Pluralization** - Automatic handling of singular/plural forms
- 💰 **Number Formatting** - Locale-aware number, currency, and percentage formatting
- 📅 **Date Formatting** - Locale-aware date and time formatting
- 🎯 **Fallback Locale** - Automatic fallback when translations are missing
- 📁 **Multiple Formats** - Load translations from JSON or YAML files
- ⚡ **Lightweight** - No heavy dependencies like i18next
- 🔒 **Type-Safe** - Full TypeScript support with strict typing

## Installation

```bash
npm install @objectos/plugin-i18n
```

For YAML support (optional):

```bash
npm install js-yaml @types/js-yaml
```

## Quick Start

```typescript
import { I18nPlugin } from '@objectos/plugin-i18n';

// Create the plugin
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  translations: {
    en: {
      greeting: 'Hello, {{name}}!',
      messages: {
        one: 'You have {{count}} message',
        other: 'You have {{count}} messages',
      },
    },
    zh: {
      greeting: '你好，{{name}}！',
      messages: {
        other: '你有 {{count}} 条消息',
      },
    },
  },
});

// Initialize the plugin
await i18n.init(context);
await i18n.start(context);

// Use translations
i18n.t('greeting', { name: 'Alice' }); // "Hello, Alice!"
i18n.t('messages', { count: 5 }); // "You have 5 messages"

// Switch locale
i18n.setLocale('zh');
i18n.t('greeting', { name: '小明' }); // "你好，小明！"
```

## Usage

### Basic Translation

```typescript
// Simple translation
i18n.t('common.save'); // "Save"

// Nested keys
i18n.t('user.profile.name'); // "Name"

// With variables
i18n.t('user.greeting', { name: 'Bob' }); // "Hello, Bob!"
```

### Locale Management

```typescript
// Get current locale
const locale = i18n.getLocale(); // "en"

// Switch locale
i18n.setLocale('fr');

// Get all loaded locales
const locales = i18n.getLoadedLocales(); // ['en', 'fr', 'zh']

// Check if translation exists
if (i18n.hasTranslation('user.name')) {
  // Translation exists
}
```

### Loading Translations

#### From Configuration

```typescript
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  translations: {
    en: {
      app: {
        title: 'My App',
        description: 'Welcome',
      },
    },
  },
});
```

#### From JSON Files

```typescript
await i18n.loadFromJson('en', './locales/en.json');
await i18n.loadFromJson('zh', './locales/zh.json');
```

#### From YAML Files

```typescript
// Enable YAML support in config
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  enableYaml: true,
});

await i18n.loadFromYaml('en', './locales/en.yml');
```

#### Add to Namespace

```typescript
// Merge translations into a namespace
i18n.addTranslations('en', 'auth', {
  login: 'Login',
  logout: 'Logout',
  signup: 'Sign Up',
});

// Use: i18n.t('auth.login')
```

### Variable Interpolation

Replace `{{variable}}` placeholders with dynamic values:

```typescript
i18n.t('user.welcome', {
  name: 'Alice',
  count: 5,
});
// "Welcome back, Alice. You have 5 new messages."

// Boolean and number values
i18n.t('status', {
  active: true,
  score: 42,
});
// "Active: true, Score: 42"
```

### Pluralization

Automatic singular/plural handling based on count:

```typescript
// Translation file
{
  "messages": {
    "zero": "No messages",
    "one": "{{count}} message",
    "other": "{{count}} messages"
  }
}

// Usage
i18n.t('messages', { count: 0 });  // "No messages"
i18n.t('messages', { count: 1 });  // "1 message"
i18n.t('messages', { count: 5 });  // "5 messages"
```

#### Supported Plural Forms

- `zero` - When count is 0
- `one` - When count is 1
- `two` - When count is 2
- `few` - For some languages (3-4 in some Slavic languages)
- `many` - For some languages
- `other` - Default plural form (required)

### Number Formatting

```typescript
// Basic number formatting
i18n.formatNumber(1234.56); // "1,234.56" (en-US)

// Currency formatting
i18n.formatNumber(99.99, {
  style: 'currency',
  currency: 'USD',
});
// "$99.99"

// Percentage formatting
i18n.formatNumber(0.75, {
  style: 'percent',
});
// "75%"

// Custom fraction digits
i18n.formatNumber(1234.5678, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
// "1,234.57"
```

### Date Formatting

```typescript
const date = new Date('2024-01-15T12:30:00Z');

// Medium date style
i18n.formatDate(date, { dateStyle: 'medium' });
// "Jan 15, 2024" (en-US)

// With time
i18n.formatDate(date, {
  dateStyle: 'short',
  timeStyle: 'short',
});
// "1/15/24, 12:30 PM"

// Custom format
i18n.formatDate(date, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
// "January 15, 2024"
```

### Interpolation Directives

Use special directives for advanced formatting:

```typescript
// Number directive
i18n.t('total', { amount: 1234.56 });
// Template: "Total: {{amount | number}}"
// Output: "Total: 1,234.56"

// Currency directive
i18n.t('price', { amount: 99.99 });
// Template: "Price: {{amount | currency:USD}}"
// Output: "Price: $99.99"

// Date directive
i18n.t('published', { date: new Date() });
// Template: "Published on {{date | date}}"
// Output: "Published on Jan 15, 2024"
```

### Fallback Locale

Automatically use fallback locale when translations are missing:

```typescript
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  translations: {
    en: {
      common: { save: 'Save', cancel: 'Cancel' },
    },
    fr: {
      common: { save: 'Enregistrer' },
      // 'cancel' is missing in French
    },
  },
});

i18n.setLocale('fr');
i18n.t('common.save'); // "Enregistrer" (French)
i18n.t('common.cancel'); // "Cancel" (fallback to English)
```

### Missing Translation Handling

```typescript
// Enable warnings
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  warnOnMissing: true,
});

// Custom handler
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  onMissingTranslation: (key, locale) => {
    return `[MISSING: ${key}]`;
  },
});

i18n.t('nonexistent.key'); // "[MISSING: nonexistent.key]"
```

## Translation File Formats

### JSON Format

```json
{
  "app": {
    "title": "My Application",
    "description": "Welcome to our app"
  },
  "user": {
    "profile": {
      "name": "Name",
      "email": "Email"
    },
    "greeting": "Hello, {{name}}!"
  },
  "messages": {
    "one": "{{count}} message",
    "other": "{{count}} messages"
  },
  "cart": {
    "total": "Total: {{amount | currency:USD}}",
    "items": {
      "zero": "Your cart is empty",
      "one": "{{count}} item",
      "other": "{{count}} items"
    }
  }
}
```

### YAML Format

```yaml
app:
  title: My Application
  description: Welcome to our app

user:
  profile:
    name: Name
    email: Email
  greeting: 'Hello, {{name}}!'

messages:
  one: '{{count}} message'
  other: '{{count}} messages'

cart:
  total: 'Total: {{amount | currency:USD}}'
  items:
    zero: Your cart is empty
    one: '{{count}} item'
    other: '{{count}} items'
```

## API Reference

### I18nPlugin

#### Constructor

```typescript
new I18nPlugin(config: I18nConfig)
```

**Config Options:**

- `defaultLocale` (string, required) - Default locale code
- `fallbackLocale` (string, optional) - Fallback locale for missing translations
- `translations` (object, optional) - Initial translation data
- `warnOnMissing` (boolean, optional) - Enable missing translation warnings (default: true)
- `onMissingTranslation` (function, optional) - Custom missing translation handler
- `interpolationDelimiters` (object, optional) - Custom delimiters (default: `{{` and `}}`)
- `enableYaml` (boolean, optional) - Enable YAML support (default: false)

#### Methods

##### `t(key: string, params?: object): string`

Translate a key with optional variable interpolation.

```typescript
i18n.t('user.greeting', { name: 'Alice' });
```

##### `getLocale(): string`

Get the current locale.

```typescript
const locale = i18n.getLocale();
```

##### `setLocale(locale: string): void`

Set the current locale.

```typescript
i18n.setLocale('fr');
```

##### `loadTranslations(locale: string, data: object): void`

Load translations for a locale (replaces existing).

```typescript
i18n.loadTranslations('en', { greeting: 'Hello' });
```

##### `addTranslations(locale: string, namespace: string, data: object): void`

Add translations to a namespace (merges with existing).

```typescript
i18n.addTranslations('en', 'auth', { login: 'Login' });
```

##### `hasTranslation(key: string, locale?: string): boolean`

Check if a translation exists.

```typescript
if (i18n.hasTranslation('user.name')) { ... }
```

##### `getLoadedLocales(): string[]`

Get all loaded locale codes.

```typescript
const locales = i18n.getLoadedLocales();
```

##### `async loadFromJson(locale: string, filePath: string): Promise<void>`

Load translations from a JSON file.

```typescript
await i18n.loadFromJson('en', './locales/en.json');
```

##### `async loadFromYaml(locale: string, filePath: string): Promise<void>`

Load translations from a YAML file (requires `js-yaml`).

```typescript
await i18n.loadFromYaml('en', './locales/en.yml');
```

##### `formatNumber(value: number, options?: NumberFormatOptions): string`

Format a number using the current locale.

```typescript
i18n.formatNumber(1234.56, { style: 'currency', currency: 'USD' });
```

##### `formatDate(value: Date, options?: DateFormatOptions): string`

Format a date using the current locale.

```typescript
i18n.formatDate(new Date(), { dateStyle: 'medium' });
```

## Best Practices

### 1. Organize Translations by Feature

```json
{
  "auth": {
    "login": "Login",
    "logout": "Logout"
  },
  "user": {
    "profile": { ... }
  },
  "products": {
    "list": { ... }
  }
}
```

### 2. Use Consistent Naming

- Use lowercase with underscores: `user_not_found`
- Or use dot notation: `user.notFound`
- Be consistent across all locales

### 3. Provide All Plural Forms

```json
{
  "items": {
    "zero": "No items",
    "one": "{{count}} item",
    "other": "{{count}} items"
  }
}
```

### 4. Use Fallback Locale

Always configure a fallback locale to prevent missing translations:

```typescript
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  fallbackLocale: 'en', // Always have a complete English translation
});
```

### 5. Handle Missing Translations Gracefully

```typescript
const i18n = new I18nPlugin({
  defaultLocale: 'en',
  warnOnMissing: true, // Log warnings in development
  onMissingTranslation: (key) => {
    // In production, return a user-friendly message
    return process.env.NODE_ENV === 'development'
      ? `[Missing: ${key}]`
      : key.split('.').pop() || key;
  },
});
```

### 6. Keep Translation Files Small

Split large translation files by feature:

```
locales/
  en/
    common.json
    auth.json
    products.json
  zh/
    common.json
    auth.json
    products.json
```

Then load them separately:

```typescript
await i18n.loadFromJson('en', './locales/en/common.json');
i18n.addTranslations('en', 'auth', JSON.parse(await fs.readFile('./locales/en/auth.json')));
```

### 7. Use TypeScript for Type Safety

```typescript
// Create a typed translation key
type TranslationKey = 'common.save' | 'common.cancel' | 'user.greeting' | 'user.welcome';

function translate(key: TranslationKey, params?: any): string {
  return i18n.t(key, params);
}
```

### 8. Test All Locales

Ensure all locales have complete translations:

```typescript
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = getAllKeys(enTranslations);
const frKeys = getAllKeys(frTranslations);
const missing = enKeys.filter((key) => !frKeys.includes(key));

if (missing.length > 0) {
  console.warn('Missing French translations:', missing);
}
```

## License

AGPL-3.0

## Contributing

Contributions are welcome! Please read the [contributing guidelines](../../../CONTRIBUTING.md) first.

## Related Packages

- [@objectos/plugin-cache](../cache) - High-performance caching
- [@objectos/plugin-storage](../storage) - Storage abstraction layer
- [@objectstack/runtime](../../core/runtime) - ObjectOS runtime core
