'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

export function FeedbackShowcase() {
  return (
    <div className="space-y-10">
      {/* Dialog */}
      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>
                This is a dialog description. You can put any content here.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      {/* Sheet */}
      <Section title="Sheet">
        <div className="flex flex-wrap gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Left</Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Left Sheet</SheetTitle>
                <SheetDescription>
                  This sheet slides in from the left.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Right</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Right Sheet</SheetTitle>
                <SheetDescription>
                  This sheet slides in from the right.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </Section>

      {/* Tooltip */}
      <Section title="Tooltip">
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a tooltip</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">With side</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Bottom tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </Section>

      {/* Toast */}
      <Section title="Toast (Sonner)">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => toast.success('Success toast!')}
          >
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.error('Error toast!')}>
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.info('Info toast!')}>
            Info
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast('Action toast', {
                action: { label: 'Undo', onClick: () => toast('Undone!') },
              })
            }
          >
            With Action
          </Button>
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is the card content area.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Small Card</CardTitle>
              <CardDescription>Compact variant.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Smaller padding and gaps.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">
              Default variant
            </p>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="pt-3">
                Content for tab 1
              </TabsContent>
              <TabsContent value="tab2" className="pt-3">
                Content for tab 2
              </TabsContent>
              <TabsContent value="tab3" className="pt-3">
                Content for tab 3
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Line variant</p>
            <Tabs defaultValue="tab1">
              <TabsList variant="line">
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="pt-3">
                Content for tab 1
              </TabsContent>
              <TabsContent value="tab2" className="pt-3">
                Content for tab 2
              </TabsContent>
              <TabsContent value="tab3" className="pt-3">
                Content for tab 3
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Section>
    </div>
  )
}
