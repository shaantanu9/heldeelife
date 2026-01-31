'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FileText,
  ShoppingBag,
  BookOpen,
  Megaphone,
  Lightbulb,
} from 'lucide-react'

interface ContentTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  content: string
}

const templates: ContentTemplate[] = [
  {
    id: 'how-to',
    name: 'How-To Guide',
    description: 'Step-by-step tutorial template',
    icon: <BookOpen className="h-5 w-5" />,
    content: `<h2>Introduction</h2>
<p>In this guide, we'll walk you through [topic] step by step.</p>

<h2>What You'll Need</h2>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

<h2>Step 1: [First Step]</h2>
<p>Detailed instructions for the first step...</p>

<h2>Step 2: [Second Step]</h2>
<p>Detailed instructions for the second step...</p>

<h2>Conclusion</h2>
<p>Summary and next steps...</p>`,
  },
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Template for reviewing products',
    icon: <ShoppingBag className="h-5 w-5" />,
    content: `<h2>Product Overview</h2>
<p>[Product name] is a [brief description].</p>

<h2>Key Features</h2>
<ul>
  <li>Feature 1</li>
  <li>Feature 2</li>
  <li>Feature 3</li>
</ul>

<h2>Pros and Cons</h2>
<h3>Pros:</h3>
<ul>
  <li>Advantage 1</li>
  <li>Advantage 2</li>
</ul>

<h3>Cons:</h3>
<ul>
  <li>Disadvantage 1</li>
  <li>Disadvantage 2</li>
</ul>

<h2>Our Verdict</h2>
<p>Final thoughts and recommendation...</p>`,
  },
  {
    id: 'news',
    name: 'News/Announcement',
    description: 'Template for news and announcements',
    icon: <Megaphone className="h-5 w-5" />,
    content: `<h2>[Headline]</h2>
<p><strong>[Date]</strong> - [Location/Context]</p>

<h2>What Happened?</h2>
<p>Main news content...</p>

<h2>Key Points</h2>
<ul>
  <li>Point 1</li>
  <li>Point 2</li>
  <li>Point 3</li>
</ul>

<h2>What This Means</h2>
<p>Analysis and implications...</p>

<h2>Next Steps</h2>
<p>What to expect or do next...</p>`,
  },
  {
    id: 'guide',
    name: 'Comprehensive Guide',
    description: 'In-depth guide template',
    icon: <FileText className="h-5 w-5" />,
    content: `<h2>Introduction</h2>
<p>Welcome to our comprehensive guide on [topic].</p>

<h2>Table of Contents</h2>
<ul>
  <li>Section 1</li>
  <li>Section 2</li>
  <li>Section 3</li>
</ul>

<h2>Section 1: [Topic]</h2>
<p>Detailed content...</p>

<h2>Section 2: [Topic]</h2>
<p>Detailed content...</p>

<h2>Section 3: [Topic]</h2>
<p>Detailed content...</p>

<h2>Conclusion</h2>
<p>Summary and key takeaways...</p>

<h2>Frequently Asked Questions</h2>
<h3>Q: [Question]?</h3>
<p>A: [Answer]</p>`,
  },
  {
    id: 'tips',
    name: 'Tips & Tricks',
    description: 'Template for tips and best practices',
    icon: <Lightbulb className="h-5 w-5" />,
    content: `<h2>Introduction</h2>
<p>Here are [X] tips to help you [achieve goal].</p>

<h2>Tip 1: [Tip Title]</h2>
<p>Explanation of the tip...</p>

<h2>Tip 2: [Tip Title]</h2>
<p>Explanation of the tip...</p>

<h2>Tip 3: [Tip Title]</h2>
<p>Explanation of the tip...</p>

<h2>Bonus Tips</h2>
<ul>
  <li>Bonus tip 1</li>
  <li>Bonus tip 2</li>
</ul>

<h2>Conclusion</h2>
<p>Wrap up and encouragement...</p>`,
  },
]

interface ContentTemplatesProps {
  onSelect: (content: string) => void
}

export function ContentTemplates({ onSelect }: ContentTemplatesProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Content Templates</DialogTitle>
          <DialogDescription>
            Choose a template to get started quickly
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                onSelect(template.content)
              }}
            >
              <div className="flex items-center gap-2 w-full">
                {template.icon}
                <span className="font-semibold">{template.name}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {template.description}
              </p>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}






