# Personal Blog MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal blog with Storybook-first component library, feed with tag filtering, markdown posts with photos, Google OAuth, and Facebook sharing.

**Architecture:** Next.js app router handles everything - public feed, API routes, auth. SQLite with Drizzle for data. Storybook for component development. Images stored locally, served via Imagor.

**Tech Stack:** TypeScript, Next.js 14, Tailwind CSS, Storybook 8, Drizzle ORM, SQLite, next-auth

---

## Phase 1: Project Setup

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, etc.

**Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
cd /Users/cgat/code/personal/blog/.worktrees/mvp
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select: Yes to all defaults

**Step 2: Verify installation**

```bash
npm run dev
```

Expected: Dev server starts at localhost:3000

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js with TypeScript and Tailwind"
```

---

### Task 1.2: Configure Tailwind with Design Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Update Tailwind config with color tokens**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'sky-blue': '#8ecae6',
        'blue-green': '#219ebc',
        'deep-space': '#023047',
        'amber-flame': '#ffb703',
        'princeton-orange': '#fb8500',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Update globals.css**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --sky-blue: #8ecae6;
  --blue-green: #219ebc;
  --deep-space: #023047;
  --amber-flame: #ffb703;
  --princeton-orange: #fb8500;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--deep-space);
  background: white;
}
```

**Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: configure Tailwind with design system colors"
```

---

### Task 1.3: Install and Configure Storybook

**Files:**
- Create: `.storybook/main.ts`, `.storybook/preview.ts`

**Step 1: Install Storybook**

```bash
npx storybook@latest init --builder webpack5
```

Select defaults when prompted.

**Step 2: Update Storybook preview to include Tailwind**

```typescript
// .storybook/preview.ts
import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**Step 3: Verify Storybook runs**

```bash
npm run storybook
```

Expected: Storybook opens at localhost:6006

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add Storybook with Tailwind integration"
```

---

### Task 1.4: Install Database Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Drizzle and SQLite**

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Drizzle ORM and SQLite dependencies"
```

---

### Task 1.5: Install Remaining Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install auth, markdown, and utility packages**

```bash
npm install next-auth@beta react-markdown remark-gfm uuid
npm install -D @types/uuid
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add auth, markdown, and utility dependencies"
```

---

## Phase 2: Storybook Foundations

### Task 2.1: Color Palette Documentation

**Files:**
- Create: `src/components/foundations/ColorPalette.tsx`
- Create: `src/components/foundations/ColorPalette.stories.tsx`

**Step 1: Create ColorPalette component**

```typescript
// src/components/foundations/ColorPalette.tsx
const colors = [
  { name: 'Sky Blue', variable: 'sky-blue', hex: '#8ecae6', usage: 'Backgrounds, hover states, tags' },
  { name: 'Blue Green', variable: 'blue-green', hex: '#219ebc', usage: 'Buttons, links, interactive elements' },
  { name: 'Deep Space', variable: 'deep-space', hex: '#023047', usage: 'Text, headers, dark accents' },
  { name: 'Amber Flame', variable: 'amber-flame', hex: '#ffb703', usage: 'Highlights, notifications, focus rings' },
  { name: 'Princeton Orange', variable: 'princeton-orange', hex: '#fb8500', usage: 'CTAs, important actions' },
];

export function ColorPalette() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-deep-space mb-6">Color Palette</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colors.map((color) => (
          <div key={color.variable} className="rounded-lg overflow-hidden shadow-md">
            <div
              className="h-24"
              style={{ backgroundColor: color.hex }}
            />
            <div className="p-4 bg-white">
              <h3 className="font-semibold text-deep-space">{color.name}</h3>
              <p className="text-sm text-gray-600 font-mono">{color.hex}</p>
              <p className="text-sm text-gray-600">var(--{color.variable})</p>
              <p className="text-sm text-gray-500 mt-2">{color.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create Storybook story**

```typescript
// src/components/foundations/ColorPalette.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ColorPalette } from "./ColorPalette";

const meta: Meta<typeof ColorPalette> = {
  title: "Foundations/ColorPalette",
  component: ColorPalette,
};

export default meta;
type Story = StoryObj<typeof ColorPalette>;

export const Default: Story = {};
```

**Step 3: Verify in Storybook**

```bash
npm run storybook
```

Navigate to Foundations/ColorPalette

**Step 4: Commit**

```bash
git add src/components/foundations/
git commit -m "feat: add ColorPalette foundation component"
```

---

### Task 2.2: Typography Documentation

**Files:**
- Create: `src/components/foundations/Typography.tsx`
- Create: `src/components/foundations/Typography.stories.tsx`

**Step 1: Create Typography component**

```typescript
// src/components/foundations/Typography.tsx
export function Typography() {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-semibold text-deep-space mb-6">Typography</h2>

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Headings</h3>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-400">heading-1 (text-3xl font-bold)</span>
            <h1 className="text-3xl font-bold text-deep-space">The quick brown fox</h1>
          </div>
          <div>
            <span className="text-sm text-gray-400">heading-2 (text-2xl font-semibold)</span>
            <h2 className="text-2xl font-semibold text-deep-space">The quick brown fox</h2>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Body</h3>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-gray-400">body (text-base)</span>
            <p className="text-base text-deep-space">The quick brown fox jumps over the lazy dog. This is body text used for main content and descriptions.</p>
          </div>
          <div>
            <span className="text-sm text-gray-400">small (text-sm)</span>
            <p className="text-sm text-gray-600">The quick brown fox jumps over the lazy dog. This is small text for captions and metadata.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-4">Interactive</h3>
        <div className="space-y-2">
          <p><a href="#" className="text-blue-green hover:underline">Link text</a></p>
          <p className="font-medium text-deep-space">Bold/Medium weight</p>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Create story**

```typescript
// src/components/foundations/Typography.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Typography } from "./Typography";

const meta: Meta<typeof Typography> = {
  title: "Foundations/Typography",
  component: Typography,
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Default: Story = {};
```

**Step 3: Commit**

```bash
git add src/components/foundations/
git commit -m "feat: add Typography foundation component"
```

---

### Task 2.3: Spacing Documentation

**Files:**
- Create: `src/components/foundations/Spacing.tsx`
- Create: `src/components/foundations/Spacing.stories.tsx`

**Step 1: Create Spacing component**

```typescript
// src/components/foundations/Spacing.tsx
const spacings = [
  { name: 'xs', value: '0.25rem', pixels: '4px', class: 'p-1' },
  { name: 'sm', value: '0.5rem', pixels: '8px', class: 'p-2' },
  { name: 'md', value: '1rem', pixels: '16px', class: 'p-4' },
  { name: 'lg', value: '1.5rem', pixels: '24px', class: 'p-6' },
  { name: 'xl', value: '2rem', pixels: '32px', class: 'p-8' },
];

export function Spacing() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-deep-space mb-6">Spacing Scale</h2>
      <div className="space-y-4">
        {spacings.map((spacing) => (
          <div key={spacing.name} className="flex items-center gap-4">
            <div className="w-20 text-sm font-mono text-gray-600">{spacing.name}</div>
            <div className="w-24 text-sm text-gray-500">{spacing.pixels}</div>
            <div
              className="bg-blue-green h-4"
              style={{ width: spacing.value === '0.25rem' ? '16px' : `calc(${spacing.value} * 4)` }}
            />
            <div className="text-sm text-gray-400">{spacing.class}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create story**

```typescript
// src/components/foundations/Spacing.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Spacing } from "./Spacing";

const meta: Meta<typeof Spacing> = {
  title: "Foundations/Spacing",
  component: Spacing,
};

export default meta;
type Story = StoryObj<typeof Spacing>;

export const Default: Story = {};
```

**Step 3: Commit**

```bash
git add src/components/foundations/
git commit -m "feat: add Spacing foundation component"
```

---

## Phase 3: Primitive Components

### Task 3.1: Button Component

**Files:**
- Create: `src/components/primitives/Button.tsx`
- Create: `src/components/primitives/Button.stories.tsx`

**Step 1: Create Button component**

```typescript
// src/components/primitives/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-green text-white hover:bg-opacity-90 focus:ring-amber-flame',
  secondary: 'bg-sky-blue text-deep-space hover:bg-opacity-80 focus:ring-blue-green',
  ghost: 'bg-transparent text-deep-space hover:bg-gray-100 focus:ring-blue-green',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Step 2: Create stories**

```typescript
// src/components/primitives/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Publish',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Cancel',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Learn more',
    variant: 'ghost',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

**Step 3: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add Button primitive component"
```

---

### Task 3.2: Input Component

**Files:**
- Create: `src/components/primitives/Input.tsx`
- Create: `src/components/primitives/Input.stories.tsx`

**Step 1: Create Input component**

```typescript
// src/components/primitives/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-deep-space mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2
            border rounded-lg
            text-deep-space placeholder-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-green focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-princeton-orange' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-princeton-orange">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**Step 2: Create stories**

```typescript
// src/components/primitives/Input.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Primitives/Input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
  },
};
```

**Step 3: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add Input primitive component"
```

---

### Task 3.3: TextArea Component

**Files:**
- Create: `src/components/primitives/TextArea.tsx`
- Create: `src/components/primitives/TextArea.stories.tsx`

**Step 1: Create TextArea component**

```typescript
// src/components/primitives/TextArea.tsx
import { TextareaHTMLAttributes, forwardRef, useEffect, useRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoExpand?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, autoExpand = false, className = '', id, onChange, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea && autoExpand) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value, autoExpand]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoExpand) {
        adjustHeight();
      }
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-deep-space mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={`
            w-full px-3 py-2
            border rounded-lg
            text-deep-space placeholder-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-green focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-none
            ${autoExpand ? 'overflow-hidden' : ''}
            ${error ? 'border-princeton-orange' : 'border-gray-300'}
            ${className}
          `}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-princeton-orange">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
```

**Step 2: Create stories**

```typescript
// src/components/primitives/TextArea.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { TextArea } from "./TextArea";

const meta: Meta<typeof TextArea> = {
  title: "Primitives/TextArea",
  component: TextArea,
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    placeholder: 'What\'s on your mind?',
    rows: 3,
  },
};

export const AutoExpand: Story = {
  args: {
    placeholder: 'Start typing... the textarea will grow',
    autoExpand: true,
    rows: 1,
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Your thoughts',
    placeholder: 'Write something...',
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: 'Post content',
    error: 'Content is required',
    rows: 3,
  },
};

export const WithMarkdownHint: Story = {
  args: {
    placeholder: 'Markdown supported: **bold**, *italic*, [links](url)',
    rows: 4,
    autoExpand: true,
  },
};
```

**Step 3: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add TextArea primitive component"
```

---

### Task 3.4: Chip Component

**Files:**
- Create: `src/components/primitives/Chip.tsx`
- Create: `src/components/primitives/Chip.stories.tsx`

**Step 1: Create Chip component**

```typescript
// src/components/primitives/Chip.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, removable = false, onRemove, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5
          text-sm font-medium rounded-full
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-green focus:ring-offset-1
          ${selected
            ? 'bg-blue-green text-white'
            : 'bg-sky-blue bg-opacity-50 text-deep-space hover:bg-opacity-75'
          }
          ${className}
        `}
        {...props}
      >
        {children}
        {removable && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onRemove?.();
              }
            }}
            className="ml-0.5 hover:text-princeton-orange"
          >
            ×
          </span>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';
```

**Step 2: Create stories**

```typescript
// src/components/primitives/Chip.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./Chip";

const meta: Meta<typeof Chip> = {
  title: "Primitives/Chip",
  component: Chip,
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    children: 'travel',
  },
};

export const Selected: Story = {
  args: {
    children: 'photography',
    selected: true,
  },
};

export const Removable: Story = {
  args: {
    children: 'thoughts',
    removable: true,
    onRemove: () => alert('Remove clicked'),
  },
};

export const FilterChips: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Chip selected>All</Chip>
      <Chip>travel</Chip>
      <Chip>photography</Chip>
      <Chip>tech</Chip>
      <Chip>thoughts</Chip>
    </div>
  ),
};

export const TagInput: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap items-center">
      <Chip removable onRemove={() => {}}>travel</Chip>
      <Chip removable onRemove={() => {}}>photography</Chip>
      <span className="text-blue-green text-sm cursor-pointer hover:underline">+ Add tag</span>
    </div>
  ),
};
```

**Step 3: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add Chip primitive component"
```

---

### Task 3.5: Avatar Component

**Files:**
- Create: `src/components/primitives/Avatar.tsx`
- Create: `src/components/primitives/Avatar.stories.tsx`

**Step 1: Create Avatar component**

```typescript
// src/components/primitives/Avatar.tsx
import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; pixels: number }> = {
  sm: { container: 'w-8 h-8', text: 'text-sm', pixels: 32 },
  md: { container: 'w-10 h-10', text: 'text-base', pixels: 40 },
  lg: { container: 'w-14 h-14', text: 'text-xl', pixels: 56 },
};

export function Avatar({ src, alt = 'Avatar', size = 'md', fallback }: AvatarProps) {
  const styles = sizeStyles[size];
  const initials = fallback?.slice(0, 2).toUpperCase() || '?';

  if (src) {
    return (
      <div className={`${styles.container} relative rounded-full overflow-hidden bg-gray-200`}>
        <Image
          src={src}
          alt={alt}
          width={styles.pixels}
          height={styles.pixels}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${styles.container} ${styles.text}
        flex items-center justify-center
        rounded-full bg-blue-green text-white font-medium
      `}
    >
      {initials}
    </div>
  );
}
```

**Step 2: Create stories**

```typescript
// src/components/primitives/Avatar.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Primitives/Avatar",
  component: Avatar,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?u=demo',
    alt: 'User avatar',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'John Doe',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
    </div>
  ),
};
```

**Step 3: Update next.config.js for external images**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

**Step 4: Commit**

```bash
git add src/components/primitives/ next.config.js
git commit -m "feat: add Avatar primitive component"
```

---

### Task 3.6: IconButton Component

**Files:**
- Create: `src/components/primitives/IconButton.tsx`
- Create: `src/components/primitives/IconButton.stories.tsx`

**Step 1: Create IconButton component**

```typescript
// src/components/primitives/IconButton.tsx
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type IconButtonVariant = 'default' | 'danger';
type IconButtonSize = 'sm' | 'md';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'text-gray-500 hover:text-deep-space hover:bg-gray-100',
  danger: 'text-gray-500 hover:text-princeton-orange hover:bg-red-50',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={`
          inline-flex items-center justify-center
          rounded-lg transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-green focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
```

**Step 2: Create stories with inline SVG icons**

```typescript
// src/components/primitives/IconButton.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./IconButton";

// Simple inline icons for stories
const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const meta: Meta<typeof IconButton> = {
  title: "Primitives/IconButton",
  component: IconButton,
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Share: Story = {
  args: {
    icon: <ShareIcon />,
    label: 'Share post',
  },
};

export const Edit: Story = {
  args: {
    icon: <EditIcon />,
    label: 'Edit post',
  },
};

export const Delete: Story = {
  args: {
    icon: <TrashIcon />,
    label: 'Delete post',
    variant: 'danger',
  },
};

export const PostActions: Story = {
  render: () => (
    <div className="flex gap-1">
      <IconButton icon={<ShareIcon />} label="Share" />
      <IconButton icon={<EditIcon />} label="Edit" />
      <IconButton icon={<TrashIcon />} label="Delete" variant="danger" />
    </div>
  ),
};
```

**Step 3: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add IconButton primitive component"
```

---

## Phase 4: Composite Components

### Task 4.1: MarkdownRenderer Component

**Files:**
- Create: `src/components/composites/MarkdownRenderer.tsx`
- Create: `src/components/composites/MarkdownRenderer.stories.tsx`

**Step 1: Create MarkdownRenderer component**

```typescript
// src/components/composites/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  truncate?: number;
}

export function MarkdownRenderer({ content, truncate }: MarkdownRendererProps) {
  const displayContent = truncate && content.length > truncate
    ? content.slice(0, truncate) + '...'
    : content;

  return (
    <div className="prose prose-slate max-w-none prose-a:text-blue-green prose-headings:text-deep-space">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
```

**Step 2: Install Tailwind typography plugin**

```bash
npm install @tailwindcss/typography
```

**Step 3: Update Tailwind config**

```typescript
// tailwind.config.ts - add to plugins array
plugins: [require('@tailwindcss/typography')],
```

**Step 4: Create stories**

```typescript
// src/components/composites/MarkdownRenderer.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "Composites/MarkdownRenderer",
  component: MarkdownRenderer,
};

export default meta;
type Story = StoryObj<typeof MarkdownRenderer>;

const sampleMarkdown = `
# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

Here's a [link](https://example.com) and some code: \`const x = 1\`

- List item 1
- List item 2
- List item 3

> This is a blockquote
`;

export const Default: Story = {
  args: {
    content: sampleMarkdown,
  },
};

export const ShortPost: Story = {
  args: {
    content: 'Just a quick thought about **life** and *stuff*.',
  },
};

export const Truncated: Story = {
  args: {
    content: 'This is a longer post that will be truncated after a certain number of characters to show a preview in the feed.',
    truncate: 50,
  },
};
```

**Step 5: Commit**

```bash
git add src/components/composites/ tailwind.config.ts package.json package-lock.json
git commit -m "feat: add MarkdownRenderer composite component"
```

---

### Task 4.2: ImageGrid Component

**Files:**
- Create: `src/components/composites/ImageGrid.tsx`
- Create: `src/components/composites/ImageGrid.stories.tsx`

**Step 1: Create ImageGrid component**

```typescript
// src/components/composites/ImageGrid.tsx
import Image from 'next/image';

interface ImageItem {
  id: string;
  url: string;
  alt?: string;
  width: number;
  height: number;
}

interface ImageGridProps {
  images: ImageItem[];
  expanded?: boolean;
}

export function ImageGrid({ images, expanded = false }: ImageGridProps) {
  if (images.length === 0) return null;

  const displayImages = expanded ? images : images.slice(0, 4);
  const remainingCount = images.length - 4;

  if (images.length === 1) {
    const img = images[0];
    return (
      <div className="rounded-lg overflow-hidden">
        <Image
          src={img.url}
          alt={img.alt || 'Post image'}
          width={img.width}
          height={img.height}
          className="w-full h-auto max-h-96 object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`grid gap-1 rounded-lg overflow-hidden ${
      displayImages.length === 2 ? 'grid-cols-2' :
      displayImages.length === 3 ? 'grid-cols-2' :
      'grid-cols-2'
    }`}>
      {displayImages.map((img, index) => (
        <div
          key={img.id}
          className={`relative ${
            displayImages.length === 3 && index === 0 ? 'row-span-2' : ''
          } ${expanded ? 'aspect-square' : 'aspect-square'}`}
        >
          <Image
            src={img.url}
            alt={img.alt || `Image ${index + 1}`}
            fill
            className="object-cover"
          />
          {!expanded && index === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">+{remainingCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Update next.config.js for placeholder images**

```javascript
// next.config.js - add picsum to remotePatterns
{
  protocol: 'https',
  hostname: 'picsum.photos',
},
```

**Step 3: Create stories**

```typescript
// src/components/composites/ImageGrid.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ImageGrid } from "./ImageGrid";

const meta: Meta<typeof ImageGrid> = {
  title: "Composites/ImageGrid",
  component: ImageGrid,
};

export default meta;
type Story = StoryObj<typeof ImageGrid>;

const mockImages = [
  { id: '1', url: 'https://picsum.photos/seed/1/800/600', width: 800, height: 600 },
  { id: '2', url: 'https://picsum.photos/seed/2/800/600', width: 800, height: 600 },
  { id: '3', url: 'https://picsum.photos/seed/3/800/600', width: 800, height: 600 },
  { id: '4', url: 'https://picsum.photos/seed/4/800/600', width: 800, height: 600 },
  { id: '5', url: 'https://picsum.photos/seed/5/800/600', width: 800, height: 600 },
];

export const SingleImage: Story = {
  args: {
    images: [mockImages[0]],
  },
};

export const TwoImages: Story = {
  args: {
    images: mockImages.slice(0, 2),
  },
};

export const ThreeImages: Story = {
  args: {
    images: mockImages.slice(0, 3),
  },
};

export const FourImages: Story = {
  args: {
    images: mockImages.slice(0, 4),
  },
};

export const MoreThanFour: Story = {
  args: {
    images: mockImages,
  },
};

export const ExpandedView: Story = {
  args: {
    images: mockImages,
    expanded: true,
  },
};
```

**Step 4: Commit**

```bash
git add src/components/composites/ next.config.js
git commit -m "feat: add ImageGrid composite component"
```

---

## Phase 4 Continued: More Composite Components

See `docs/plans/2026-01-31-mvp-implementation-part2.md` for remaining tasks:
- Task 4.3: MarkdownEditor
- Task 4.4: PostCard
- Task 4.5: Composer
- Task 4.6: FilterBar
- Task 4.7: ShareMenu
- Task 4.8: ConfirmDialog
- Task 4.9: FeedLayout
- Phase 5: Database Schema
- Phase 6: API Routes
- Phase 7: Authentication
- Phase 8: Page Assembly
- Phase 9: Sharing & OG Images
