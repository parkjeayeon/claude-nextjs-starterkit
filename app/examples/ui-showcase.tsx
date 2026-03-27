import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  )
}

export function UiShowcase() {
  return (
    <div className="space-y-10">
      {/* Text */}
      <Section title="Text">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Header variants</p>
            <div className="space-y-1">
              <Text variant="h1" as="h1">
                Header 1 — 30px
              </Text>
              <Text variant="h2" as="h2">
                Header 2 — 24px
              </Text>
              <Text variant="h3" as="h3">
                Header 3 — 20px
              </Text>
              <Text variant="h4" as="h4">
                Header 4 — 18px
              </Text>
              <Text variant="h5" as="h5">
                Header 5 — 14px
              </Text>
              <Text variant="h6" as="h6">
                Header 6 — 12px
              </Text>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Body variants</p>
            <div className="space-y-1">
              <Text variant="body1">Body 1 — 20px</Text>
              <Text variant="body2">Body 2 — 18px</Text>
              <Text variant="body3">Body 3 — 16px (default)</Text>
              <Text variant="body4">Body 4 — 15px</Text>
              <Text variant="body5">Body 5 — 14px</Text>
              <Text variant="body6">Body 6 — 13px</Text>
              <Text variant="body7">Body 7 — 12px</Text>
              <Text variant="body8">Body 8 — 10px</Text>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Color variants</p>
            <div className="space-y-1">
              <Text color="default">Default color</Text>
              <Text color="muted">Muted color</Text>
              <Text color="destructive">Destructive color</Text>
              <Text color="accent">Accent color</Text>
            </div>
          </div>
        </div>
      </Section>

      {/* Button */}
      <Section title="Button">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default">Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs">XS</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      {/* Badge */}
      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      {/* Avatar */}
      <Section title="Avatar">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </div>
      </Section>

      {/* Separator */}
      <Section title="Separator">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Horizontal separator below
          </p>
          <Separator />
          <div className="flex h-6 items-center gap-4">
            <span className="text-sm">Item A</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Item B</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Item C</span>
          </div>
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Section>
    </div>
  )
}
